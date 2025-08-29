const busboy = require('busboy')
const { WriteStream } = require('fs-capacitor')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const {
    FILE_RECORD_META_FIELDS,
    FILE_RECORD_PUBLIC_META_FIELDS,
} = require('@open-condo/files/schema/models')
const { FileRecord } = require('@open-condo/files/schema/utils/serverSchema')
const { GQLError } = require('@open-condo/keystone/errors')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getKVClient } = require('@open-condo/keystone/kv')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

const { ERRORS } = require('./errors')

const DEFAULT_USER_HOUR_QUOTA = 100
const DEFAULT_IP_HOUR_QUOTA = 100
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
const fileMetaSymbol = Symbol('fileMeta')

const AppClientSchema = z.object({
    name: z.string().min(3).optional(),
    secret: z.string().min(8),
}).strict()

const AppClientsSchema = z.record(
    z.string().regex(/^[a-zA-Z0-9-]+$/),
    AppClientSchema
)

const AppConfigSchema = z.object({
    clients: AppClientsSchema,
    quota: z.object({
        user: z.number().optional().default(DEFAULT_USER_HOUR_QUOTA),
        ip: z.number().optional().default(DEFAULT_IP_HOUR_QUOTA),
    }).optional().default({
        user: DEFAULT_USER_HOUR_QUOTA,
        ip: DEFAULT_IP_HOUR_QUOTA,
    }),
})

function validateAndParseFileConfig (config) {
    const { data, success, error } = AppConfigSchema.safeParse(config)
    if (!success) {
        console.error(z.prettifyError(error))
        return {}
    }
    return data
}

// ---------------------- utilities ----------------------

const FINGERPRINT_RE = /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`~]{5,42}$/

// ---------------------- guards ----------------------

class RedisGuard {
    constructor () {
        this.counterPrefix = 'guard_counter:'
        this._client = getKVClient('guards')
    }

    async incrementHourCounter (variable) {
        return this.incrementCustomCounter(variable, 3600)
    }

    async incrementCustomCounter (variable, ttl) {
        const afterIncrement = await this._client.incr(`${this.counterPrefix}${variable}`)
        if (afterIncrement === 1) {
            await this._client.expire(`${this.counterPrefix}${variable}`, ttl)
        }
        return afterIncrement
    }
}

// ---------------------- validation ----------------------
const MetaSchema = z.object({
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
    authedItemId: z.uuid(),
    appId: z.string().min(1),
    modelNames: z.array(z.string()).min(1),
}).strict()

function parseAndValidateMeta (raw, req, next, onError) {
    let candidate = raw
    if (typeof raw === 'string') {
        try {
            candidate = JSON.parse(raw)
        } catch {
            return onError(() => next(new GQLError(ERRORS.INVALID_META, { req })))
        }
    } else if (typeof raw !== 'object' || raw === null) {

        return onError(() => next(new GQLError(ERRORS.INVALID_META, { req })))
    }

    const result = MetaSchema.safeParse(candidate)
    if (!result.success) {

        return onError(() => next(new GQLError(ERRORS.INVALID_META, { req }, [result.error])))
    }

    const meta = result.data
    if (meta.authedItemId !== req.user.id) {
        return onError(() => next(new GQLError(ERRORS.INVALID_META, { req })))
    }

    return meta
}

const SharePayloadSchema = z.object({
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
    id: z.uuid(),
    authedItemId: z.uuid(),
    appId: z.string().min(1),
    modelNames: z.array(z.string()).min(1).optional(),
}).strict()

const FileMetaSignatureSchema = z.object({
    id: z.string(),
    recordId: z.uuid(),
    path: z.string().nullable(),
    filename: z.string(),
    originalFilename: z.string(),
    mimetype: z.string(),
    encoding: z.string(),
    meta: z.object({
        dv: z.literal(1),
        sender: z.object({
            dv: z.literal(1),
            fingerprint: z.string().regex(FINGERPRINT_RE),
        }).strict(),
        authedItemId: z.uuid(),
        appId: z.string(),
        modelNames: z.array(z.string()).min(1).optional(),
        sourceAppId: z.string().nullable(),
    }).strict(),
    iat: z.number(),
    exp: z.number(),
}).strict()

function parseAndValidateFileMetaSignature (data) {
    return z.safeParse(FileMetaSignatureSchema, data)
}
// ---------------------- handlers ----------------------

function authHandler ()  {
    return async function (req, res, next) {
        if (!req.user || req.user.deletedAt !== null) {

            const error = new GQLError(ERRORS.AUTHORIZATION_REQUIRED, { req })
            return next(error)
        }
        next()
    }
}

function rateLimitHandler ({ quota, guard }) {
    return async function (req, res, next) {
        const requestIp = req.ip
        const userId = req.user.id

        const idCounter = await guard.incrementHourCounter(`file:${userId}`)
        if (idCounter > quota.user) {

            const error = new GQLError(ERRORS.RATE_LIMIT_EXCEEDED, { req })
            return next(error)
        }

        const ipCounter = await guard.incrementHourCounter(`file:${requestIp}`)
        if (ipCounter > quota.ip) {
            const error = new GQLError(ERRORS.RATE_LIMIT_EXCEEDED, { req })
            return next(error)
        }

        next()
    }
}

function parserHandler ({ processRequestOptions }) {
    // That's originally took from graphql-upload/processRequest.js
    return async function (req, res, next) {
        if (!req.is('multipart/form-data')) {
            const error = new GQLError(ERRORS.WRONG_REQUEST_METHOD_TYPE, { req })
            return next(error)
        }

        let exitError
        let released = false
        let meta

        const requestEnd = new Promise(resolve => req.on('end', resolve))
        const { send } = res
        res.send = (...args) => {
            requestEnd.then(() => {
                res.send = send
                res.send(...args)
            })
        }

        const parser = busboy({
            headers: req.headers,
            limits: {
                fieldSize: processRequestOptions.maxFieldSize,
                fields: 2,
                fileSize: processRequestOptions.maxFileSize,
                files: processRequestOptions.maxFiles,
            },
        })

        const exit = (withError) => {
            if (exitError) return
            exitError = withError
            parser.destroy()
            req.unpipe(parser)
            setImmediate(() => req.resume())
            withError()
        }

        parser.on('error', () => {
            exit(() => next(new GQLError(ERRORS.UNABLE_TO_PARSE_FILE_CONTENT, { req })))
        })

        parser.on('file', (fieldName, stream, { filename, encoding, mimeType: mimetype }) => {
            let fileError
            const capacitor = new WriteStream()

            capacitor.on('error', () => {
                stream.unpipe()
                stream.resume()
            })

            stream.on('limit', () => {
                stream.unpipe()
                capacitor.destroy(fileError)
                return next(new GQLError(ERRORS.PAYLOAD_TOO_LARGE, { req }))
            })

            stream.on('error', (error) => {
                fileError = error
                stream.unpipe()
                capacitor.destroy(fileError)
            })

            const file = {
                filename,
                mimetype,
                encoding,
                stream,
                createReadStream (options) {
                    const error = fileError || (released ? exitError : null)
                    if (error) throw error
                    return capacitor.createReadStream(options)
                },
                capacitor,
            }

            Object.defineProperty(file, 'capacitor', {
                enumerable: false,
                configurable: false,
                writable: false,
            })

            stream.pipe(capacitor)
            if (!Array.isArray(req.files)) req.files = [file]
            else req.files.push(file)
        })

        parser.once('filesLimit', () =>
            exit(() => next(new GQLError(ERRORS.MAX_FILE_UPLOAD_LIMIT_EXCEEDED, { req })))
        )

        parser.on('field', (fieldName, value, { valueTruncated }) => {
            if (valueTruncated) {
                return exit(() => next(new GQLError(ERRORS.PAYLOAD_TOO_LARGE, { req })))
            }

            if (fieldName === 'meta') {
                meta = parseAndValidateMeta(value, req, next, exit)
            }

            req[fileMetaSymbol] = meta

        })

        parser.once('finish', () => {
            req.unpipe(parser)
            req.resume()

            if (!Array.isArray(req.files)) {
                return exit(() => next(new GQLError(ERRORS.MISSING_ATTACHED_FILES, { req })))
            }
            if (!meta) {
                return exit(() => next(new GQLError(ERRORS.MISSING_META, { req })))
            }
            next()
        })

        req.once('close', () => {
            if (!req.readableEnded) {
                exit(() => next(new GQLError(ERRORS.REQUEST_DISCONNECTED, { req })))
            }
        })

        res.once('close', () => { released = true })
        req.pipe(parser)
    }
}

function fileStorageHandler ({ keystone, appClients }) {
    return async function (req, res, next) {
        const { [fileMetaSymbol]: meta, files } = req
        const appClient = appClients ? appClients[meta.appId] : undefined

        if (!(meta['appId'] in (appClients || {}))) {
            const error = new GQLError(ERRORS.INVALID_APP_ID, { req })
            return next(error)
        }

        const fileAdapter = new FileAdapter(meta['appId'])
        const context = keystone.createContext({ skipAccessControl: true })
        const savedFiles = await Promise.all(
            files.map(file =>
                fileAdapter.save({
                    stream: file.createReadStream(),
                    filename: file.filename,
                    mimetype: file.mimetype,
                    encoding: file.encoding,
                    id: generateUUIDv4(),
                    fileAdapter: FileAdapter.type(),
                    meta,
                })
            )
        )

        const createdFiles = await FileRecord.createMany(
            context,
            savedFiles.map((data, index) => ({
                data: {
                    fileMeta: {
                        ...data,
                        originalFilename: files[index].filename,
                        mimetype: files[index].mimetype,
                        encoding: files[index].encoding,
                        fileAdapter: FileAdapter.type(),
                        meta,
                    },
                    dv: meta.dv,
                    sender: meta.sender,
                    user: { connect: { id: req.user.id } },
                    fileAdapter: FileAdapter.type(),
                },
            })),
            `id fileMeta ${FILE_RECORD_META_FIELDS}`
        )
        const fileRecords = await FileRecord.updateMany(context,
            createdFiles.map(e => ({
                id: e.id, data: { fileMeta: { ...e.fileMeta, recordId: e.id }, dv: meta.dv, sender: meta.sender },
            })), `id fileMeta ${FILE_RECORD_PUBLIC_META_FIELDS}`)

        res.json({
            data: {
                files: fileRecords.map(file => ({
                    id: file.id,
                    signature: jwt.sign(
                        file.fileMeta,
                        appClient.secret,
                        { expiresIn: '5m', algorithm: 'HS256' }
                    ),
                })),
            },
        })
    }
}

function fileShareHandler ({ keystone, appClients }) {
    return async function (req, res, next) {
        const {
            success,
            error,
            data,
        } = SharePayloadSchema.safeParse(req.body)

        if (!success) {
            return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }, [error]))
        }

        const { id, appId, authedItemId, modelNames, dv, sender } = data

        if (!(appId in (appClients || {}))) {
            return next(new GQLError(ERRORS.INVALID_APP_ID, { req }))
        }

        const appClient = appClients[appId]

        const context = keystone.createContext({ skipAccessControl: true })
        const fileRecord = await FileRecord
            .getOne(context, { id, user: { id: req.user.id }, deletedAt: null }, `id sourceId sourceApp fileMeta ${FILE_RECORD_META_FIELDS}`)

        if (!fileRecord) {
            return next(new GQLError(ERRORS.FILE_NOT_FOUND, { req }))
        }

        /*
         * These two stands for reshare file
         * So if we share file_1 -> it create file_2 with point to file_1
         * And then if we want to share file_2, file_3 should also point to file_1
         * That's because only original file binary can be found in storage
         */
        const sourceAppId = fileRecord.sourceApp === null
            ? fileRecord.fileMeta.meta.appId
            : fileRecord.sourceApp
        const sourceId = fileRecord.sourceId === null
            ? fileRecord.id
            : fileRecord.sourceId
        // Clean original fields, replace with new one and add marker that this file was shared
        const sharedFileMeta = {
            ...fileRecord.fileMeta,
            meta: {
                ...fileRecord.fileMeta.meta,
                appId,
                authedItemId,
                sourceAppId,
                modelNames,
            },
        }

        const created = await FileRecord.create(context, {
            fileMeta: sharedFileMeta,
            dv, sender,
            user: { connect: { id: authedItemId } },
            sourceId: { connect: { id: sourceId } }, // point to original FileRecord
            sourceApp: sourceAppId, // original appId for routing
        }, `id fileMeta ${FILE_RECORD_META_FIELDS}`)

        const sharedFile = await FileRecord.update(context, created.id, {
            fileMeta: { ...created.fileMeta, recordId: created.id },
            dv, sender,
        }, `id fileMeta ${FILE_RECORD_PUBLIC_META_FIELDS}`)

        res.json({
            data: {
                file: {
                    id: sharedFile.id,
                    signature: jwt.sign(
                        sharedFile.fileMeta,
                        appClient.secret,
                        { expiresIn: '5m', algorithm: 'HS256' }
                    ),
                },
            },
        })
    }
}

module.exports = {
    // zod entry point
    validateAndParseFileConfig,

    // helpers
    parseAndValidateMeta,
    parseAndValidateFileMetaSignature,
    RedisGuard,

    // handlers
    authHandler,
    rateLimitHandler,
    parserHandler,
    fileStorageHandler,
    fileShareHandler,

    __test__: {
        MetaSchema,
        SharePayloadSchema,
    },
}
