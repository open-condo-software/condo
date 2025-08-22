const busboy = require('busboy')
const cuid = require('cuid')
const { WriteStream } = require('fs-capacitor')
const jwt = require('jsonwebtoken')
const { validate: validateUUID } = require('uuid')
const { z } = require('zod')

const { FileRecord } = require('@open-condo/files/schema/utils/serverSchema')
const  { GQLError } = require('@open-condo/keystone/errors')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getKVClient } = require('@open-condo/keystone/kv')

const { ERRORS } = require('./errors')

const DEFAULT_USER_HOUR_QUOTA = 100
const DEFAULT_IP_HOUR_QUOTA = 100

const AppClientSchema = z.object({
    name: z.string().min(3).optional(),
    modelNames: z.array(z.string()).min(1).optional(),
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
        console.error(error.issues[0]?.message || 'Invalid file upload config')
        return {}
    }
    return data
}

// ---------------------- utilities ----------------------

const FINGERPRINT_RE = /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`~]{5,42}$/

function sendError (req, next, error) {
    return next(new GQLError(error, { req }))
}

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
    authedItem: z.string().uuid(),
    appId: z.string().min(1),
    modelNames: z.array(z.string()).min(1),
}).strict()

function parseAndValidateMeta (raw, req, next, onError) {
    let candidate = raw
    if (typeof raw === 'string') {
        try {
            candidate = JSON.parse(raw)
        } catch {
            return onError(() => sendError(req, next, { ...ERRORS.INVALID_META, message:'Invalid type for the "meta" multipart field' }))
        }
    } else if (typeof raw !== 'object' || raw === null) {
        return onError(() => sendError(req, next, { ...ERRORS.INVALID_META, message:'Invalid type for the "meta" multipart field' }))
    }

    const result = MetaSchema.safeParse(candidate)
    if (!result.success) {
        const message = result.error.issues[0]?.message || 'Invalid meta'
        return onError(() => sendError(req, next, { ...ERRORS.INVALID_META, message }))
    }

    const meta = result.data
    if (!validateUUID(meta.authedItem)) {
        return onError(() => sendError(req, next, { ...ERRORS.INVALID_META, message: 'Invalid uuid format' }))
    }

    if (meta.authedItem !== req.user.id) {
        return onError(() => sendError(req, next, { ...ERRORS.INVALID_META, message: 'Wrong authedItem. Unable to upload file for another user' }))
    }

    return meta
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
            exit(() => sendError(req, next, ERRORS.UNABLE_TO_PARSE_FILE_CONTENT))
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
                sendError(req, next, ERRORS.PAYLOAD_TOO_LARGE)
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
            exit(() => sendError(req, next, ERRORS.MAX_FILE_UPLOAD_LIMIT_EXCEEDED))
        )

        parser.on('field', (fieldName, value, { valueTruncated }) => {
            if (valueTruncated) {
                return exit(() =>
                    sendError(req, next, ERRORS.PAYLOAD_TOO_LARGE)
                )
            }

            if (fieldName === 'meta') {
                meta = parseAndValidateMeta(value, req, next, exit)
            }

            req.meta = meta
        })

        parser.once('finish', () => {
            req.unpipe(parser)
            req.resume()

            if (!Array.isArray(req.files)) {
                return exit(() => sendError(req, next, ERRORS.MISSING_ATTACHED_FILES))
            }
            if (!meta) {
                return exit(() => sendError(req, next, ERRORS.MISSING_META))
            }
            next()
        })

        req.once('close', () => {
            if (!req.readableEnded) {
                exit(() => sendError(req, next, ERRORS.REQUEST_DISCONNECTED))
            }
        })

        res.once('close', () => { released = true })
        req.pipe(parser)
    }
}

function fileStorageHandler ({ keystone, appClients }) {
    return async function (req, res, next) {
        const { meta, files } = req
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
                    id: cuid(),
                    meta: { ...meta, fileAdapter: fileAdapter.type },
                })
            )
        )

        const condoFiles = await FileRecord.createMany(
            context,
            savedFiles.map((data, index) => ({
                data: {
                    fileMeta: {
                        ...data,
                        originalFilename: files[index].filename,
                        mimetype: files[index].mimetype,
                        encoding: files[index].encoding,
                        meta,
                    },
                    dv: meta.dv,
                    sender: meta.sender,
                    user: { connect: { id: req.user.id } },
                },
            })),
            'id fileMeta'
        )

        res.json({
            data: {
                files: condoFiles.map(file => ({
                    ...file,
                    signature: jwt.sign(
                        file.fileMeta,
                        appClient.secret,
                        { expiresIn: '5m' }
                    ),
                })),
            },
        })
    }
}

module.exports = {
    // zod entry point
    validateAndParseFileConfig,

    // helpers
    sendError,
    parseAndValidateMeta,
    RedisGuard,

    // handlers
    authHandler,
    rateLimitHandler,
    parserHandler,
    fileStorageHandler,

    __test__: {
        MetaSchema,
    },
}
