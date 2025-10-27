const fs = require('fs')
const path = require('path')

const { formidable } = require('formidable')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const {
    FILE_RECORD_META_FIELDS,
    FILE_RECORD_PUBLIC_META_FIELDS,
    FILE_RECORD_ATTACHMENTS,
    FILE_RECORD_USER_META,
} = require('@open-condo/files/schema/models')
const { FileRecord } = require('@open-condo/files/schema/utils/serverSchema')
const { GQLError } = require('@open-condo/keystone/errors')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getKVClient } = require('@open-condo/keystone/kv')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

const { ERRORS } = require('./errors')

const DEFAULT_USER_HOUR_QUOTA = 100
const fileMetaSymbol = Symbol.for('fileMeta')

const AppClientSchema = z.object({
    name: z.string().min(3).optional(),
    secret: z.string().min(8),
}).strict()

const AppClientsSchema = z.record(
    z.string().regex(/^[a-zA-Z0-9-]+$/),
    AppClientSchema
)

const QuotaSchema = z.object({
    default: z.number().optional().default(DEFAULT_USER_HOUR_QUOTA),
    whitelist: z.array(z.uuid()).optional().default([]),
    overrides: z.record(z.uuid(), z.number().int().nonnegative()).optional().default({}),
})

const AppConfigSchema = z.object({
    clients: AppClientsSchema,
    quota: QuotaSchema.optional().default({ default: DEFAULT_USER_HOUR_QUOTA, whitelist: [], overrides: {} }),
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
const InlineAttachPayloadSchema = z.object({
    itemId: z.uuid(),
    modelName: z.string().min(1),
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
}).strict()

const MetaSchema = z.object({
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
    user: z.object({ id: z.uuid() }).strict(),
    fileClientId: z.string().min(1),
    modelNames: z.array(z.string()).min(1),
    organization: z.object({ id: z.uuid() }).strict().optional(),
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
        const extraErrors = [new Error(z.prettifyError(result.error))]
        return onError(() => next(new GQLError(ERRORS.INVALID_META, { req }, extraErrors)))
    }

    const meta = result.data
    if (meta.user.id !== req.user.id) {
        return onError(() => next(new GQLError(ERRORS.INVALID_META, { req })))
    }

    return meta
}

const AttachBodyPayloadSchema = z.object({
    itemId: z.uuid(),
    modelName: z.string().min(1),
    signature: z.string().min(1),
    fileClientId: z.string().min(1),
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
}).strict()

const SharePayloadSchema = z.object({
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
    id: z.uuid(),
    user: z.object({ id: z.uuid() }).strict(),
    fileClientId: z.string().min(1),
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
        user: z.object({
            id: z.uuid(),
        }).strict(),
        fileClientId: z.string(),
        modelNames: z.array(z.string()).min(1).optional(),
        sourceFileClientId: z.string().nullable(),
    }).strict(),
    iat: z.number(),
    exp: z.number(),
}).strict()

const FileUploadMetaSchema = z.object({
    id: z.uuid(),
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
    user: z.object({
        id: z.uuid(),
    }).strict(),
    fileClientId: z.string(),
    modelNames: z.array(z.string()).min(1).optional(),
    sourceFileClientId: z.string().nullable(),
    iat: z.number(),
    exp: z.number(),
}).strict()

const FileAttachSchema = z.object({
    id: z.uuid(), // id of FileRecord
    itemId: z.uuid(), // id of model to which file should be attached
    modelName: z.string().min(1),
    user: z.object({
        id: z.uuid(),
    }).strict(),
    fileClientId: z.string().min(1), // Application which has rights to upload files via file service
    dv: z.literal(1),
    sender: z.object({
        dv: z.literal(1),
        fingerprint: z.string().regex(FINGERPRINT_RE),
    }).strict(),
}).strict()

function validateFileUploadSignature (data) {
    return z.safeParse(FileUploadMetaSchema, data)
}

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
        const userId = req.user.id

        if (quota?.whitelist?.includes(userId)) {
            return next()
        }

        const userLimit = quota?.overrides?.[userId] ?? quota?.default ?? DEFAULT_USER_HOUR_QUOTA
        const idCounter = await guard.incrementHourCounter(`file:${userId}`)

        if (idCounter > userLimit) {
            return next(new GQLError(ERRORS.RATE_LIMIT_EXCEEDED, { req }))
        }

        next()
    }
}


function parserHandler ({ processRequestOptions } = {}) {
    return function (req, res, next) {
        if (!req.is('multipart/form-data')) {
            return next(new GQLError(ERRORS.WRONG_REQUEST_METHOD_TYPE, { req }))
        }

        const form = formidable({ // NOSONAR - folder used for temp step of the upload and not used for file distribution
            maxFiles: processRequestOptions?.maxFiles ?? 1,
            maxFileSize: processRequestOptions?.maxFileSize ?? 20 * 1024 ** 2,
            maxFields: 2, // meta + optional attach
            maxFieldsSize: processRequestOptions?.maxFieldSize ?? 20 * 1024 * 1024,
            multiples: true,
        })

        form.parse(req, (err, fields, files) => {
            if (err) {
                if (err.code === 'ETOOBIG') return next(new GQLError(ERRORS.PAYLOAD_TOO_LARGE, { req }))
                return next(new GQLError(ERRORS.UNABLE_TO_PARSE_FILE_CONTENT, { req }, [err]))
            }

            // ---------- meta (required) ----------
            let rawMeta = fields?.meta
            if (Array.isArray(rawMeta)) rawMeta = rawMeta[0]
            if (!rawMeta) return next(new GQLError(ERRORS.MISSING_META, { req }))

            const meta = parseAndValidateMeta(rawMeta, req, next, (invoke) => invoke())
            if (!meta) return

            // ---------- optional attach ----------
            let rawAttach = fields?.attach
            if (Array.isArray(rawAttach)) rawAttach = rawAttach[0]
            let inlineAttach = undefined
            if (rawAttach !== undefined) {
                let candidate = rawAttach
                if (typeof rawAttach === 'string') {
                    try {
                        candidate = JSON.parse(rawAttach)
                    } catch {
                        return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }))
                    }
                } else if (typeof rawAttach !== 'object' || rawAttach === null) {
                    return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }))
                }

                const parsed = InlineAttachPayloadSchema.safeParse(candidate)
                if (!parsed.success) {
                    const extraErrors = [new Error(z.prettifyError(parsed.error))]
                    return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }, extraErrors))
                }
                inlineAttach = parsed.data
            }

            // ---------- files ----------
            const fileList = Object.values(files || {}).flat().filter(Boolean)
            if (!fileList.length) return next(new GQLError(ERRORS.MISSING_ATTACHED_FILES, { req }))

            req.files = fileList.map((f) => {
                const safeName = f.originalFilename ? path.basename(f.originalFilename) : path.basename(f.filepath)
                return {
                    size: f.size ?? 0,
                    filename: safeName,
                    mimetype: f.mimetype || 'application/octet-stream',
                    encoding: 'binary',
                    createReadStream: () => fs.createReadStream(f.filepath),
                    filepath: f.filepath,
                    originalFilename: f.originalFilename,
                }
            })

            req[fileMetaSymbol] = meta
            req.inlineAttach = inlineAttach
            next()
        })
    }
}

function fileStorageHandler ({ keystone, appClients }) {
    return async function (req, res, next) {
        const { [fileMetaSymbol]: meta, files, inlineAttach } = req
        const appClient = appClients ? appClients[meta.fileClientId] : undefined

        if (!(meta['fileClientId'] in (appClients || {}))) {
            const error = new GQLError(ERRORS.INVALID_APP_ID, { req })
            return next(error)
        }

        const fileAdapter = new FileAdapter(meta['fileClientId'])
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

        // clean tmp files
        files.map(file => {
            if (file.filepath) {
                fs.promises.unlink(file.filepath).catch(() => {})
            }
        })

        const organizationId = meta?.organization?.id

        const createdFiles = await FileRecord.createMany(
            context,
            savedFiles.map((data, index) => ({
                data: {
                    fileMeta: {
                        ...data,
                        originalFilename: files[index].filename,
                        mimetype: files[index].mimetype,
                        size: String(files[index].size),
                        encoding: files[index].encoding,
                        fileAdapter: FileAdapter.type(),
                        meta,
                    },
                    dv: meta.dv,
                    sender: meta.sender,
                    user: { connect: { id: req.user.id } },
                    ...(organizationId && { organization: { connect: { id: organizationId } } }),
                    fileAdapter: FileAdapter.type(),
                    fileSize: String(files[index].size),
                    fileMimeType: files[index].mimetype,
                },
            })),
            `id fileMeta ${FILE_RECORD_META_FIELDS}`
        )
        const fileRecords = await FileRecord.updateMany(context,
            createdFiles.map(e => ({
                id: e.id, data: { fileMeta: { ...e.fileMeta, recordId: e.id }, dv: meta.dv, sender: meta.sender },
            })), `id fileMeta { meta ${FILE_RECORD_USER_META} }`)

        // --- NEW: optionally attach inline ---
        let result = []
        if (!inlineAttach) {
            // classic behavior
            result = fileRecords.map(file => ({
                id: file.id,
                signature: jwt.sign(
                    { id: file.id, ...file.fileMeta.meta },
                    appClient.secret,
                    { expiresIn: '5m', algorithm: 'HS256' }
                ),
            }))
        } else {
            // validate modelName against meta.modelNames
            if (!Array.isArray(meta.modelNames) || !meta.modelNames.includes(inlineAttach.modelName)) {
                return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }))
            }

            // Attach all uploaded files to the same item/model
            result = await Promise.all(fileRecords.map(async (fileRecord) => {
                const fileMeta = fileRecord.fileMeta
                const originalAttachments = fileRecord.attachments?.attachments

                const newAttachment = {
                    modelName: inlineAttach.modelName,
                    id: inlineAttach.itemId,
                    fileClientId: meta.fileClientId,
                    user: { id: req.user.id },
                }
                const resultAttachments = Array.isArray(originalAttachments)
                    ? [...originalAttachments, newAttachment]
                    : [newAttachment]

                const updated = await FileRecord.update(context, fileRecord.id, {
                    dv: inlineAttach.dv,
                    sender: inlineAttach.sender,
                    attachments: { attachments: resultAttachments },
                }, `id fileMeta ${FILE_RECORD_PUBLIC_META_FIELDS}`)

                return {
                    id: updated.id,
                    signature: jwt.sign(
                        { id: updated.id, ...fileMeta.meta },
                        appClient.secret,
                        { expiresIn: '5m', algorithm: 'HS256' }
                    ),
                    attached: true,
                    publicSignature: jwt.sign(
                        updated.fileMeta,
                        appClient.secret,
                        { expiresIn: '5m', algorithm: 'HS256' }
                    ),
                }
            }))
        }

        res.json({ data: { files: result } })
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

        const { id, fileClientId, user, modelNames, dv, sender } = data

        if (!(fileClientId in (appClients || {}))) {
            return next(new GQLError(ERRORS.INVALID_APP_ID, { req }))
        }

        const appClient = appClients[fileClientId]

        const context = keystone.createContext({ skipAccessControl: true })
        const fileRecord = await FileRecord
            .getOne(context, { id, user: { id: req.user.id }, deletedAt: null }, `id fileMimeType fileSize sourceFileRecord sourceApp fileMeta ${FILE_RECORD_META_FIELDS}`)

        if (!fileRecord) {
            return next(new GQLError(ERRORS.FILE_NOT_FOUND, { req }))
        }

        /*
         * These two stands for reshare file
         * So if we share file_1 -> it create file_2 with point to file_1
         * And then if we want to share file_2, file_3 should also point to file_1
         * That's because only original file binary can be found in storage
         */
        const sourceFileClientId = fileRecord.sourceApp === null
            ? fileRecord.fileMeta.meta.fileClientId
            : fileRecord.sourceApp
        const sourceFileRecord = fileRecord.sourceFileRecord === null
            ? fileRecord.id
            : fileRecord.sourceFileRecord
        // Clean original fields, replace with new one and add marker that this file was shared
        const sharedFileMeta = {
            ...fileRecord.fileMeta,
            meta: {
                ...fileRecord.fileMeta.meta,
                fileClientId,
                user: { id: user.id },
                sourceFileClientId,
                modelNames,
            },
        }

        const created = await FileRecord.create(context, {
            fileMeta: sharedFileMeta,
            dv, sender,
            user: { connect: { id: user.id } },
            sourceFileRecord: { connect: { id: sourceFileRecord } }, // point to original FileRecord
            sourceApp: sourceFileClientId, // original fileClientId for routing
            fileMimeType: fileRecord.fileMimeType,
            fileSize: fileRecord.fileSize,
        }, `id fileMeta ${FILE_RECORD_META_FIELDS}`)

        const sharedFile = await FileRecord.update(context, created.id, {
            fileMeta: { ...created.fileMeta, recordId: created.id },
            dv, sender,
        }, `id fileMeta { meta ${FILE_RECORD_USER_META} }`)

        res.json({
            data: {
                file: {
                    id: sharedFile.id,
                    signature: jwt.sign(
                        { id: sharedFile.id, ...sharedFile.fileMeta.meta },
                        appClient.secret,
                        { expiresIn: '5m', algorithm: 'HS256' }
                    ),
                },
            },
        })
    }
}

function fileAttachHandler ({ keystone, appClients }) {
    return async function (req, res, next) {
        const {
            success,
            error,
            data,
        } = AttachBodyPayloadSchema.safeParse(req.body)

        if (!success) {
            return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }, [error]))
        }

        const { modelName, itemId, signature, fileClientId, dv, sender } = data

        if (!(fileClientId in (appClients || {}))) {
            return next(new GQLError(ERRORS.INVALID_APP_ID, { req }))
        }

        let decryptedData

        try {
            decryptedData = await jwt.verify(signature, appClients[fileClientId].secret, { algorithm: 'HS256' })
        } catch (e) {
            return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }))
        }

        const user = { id: req.user.id }

        const context = keystone.createContext({ skipAccessControl: true })
        const fileRecord = await FileRecord.getOne(context, { id: decryptedData.id, user }, `id attachments ${FILE_RECORD_ATTACHMENTS} fileMeta ${FILE_RECORD_META_FIELDS}`)

        if (!fileRecord) {
            return next(new GQLError(ERRORS.FILE_NOT_FOUND, { req }))
        }

        const fileMeta = fileRecord.fileMeta

        if (!fileMeta.meta.modelNames.includes(modelName)) {
            return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }))
        }

        if (fileMeta.meta.fileClientId !== fileClientId) {
            return next(new GQLError(ERRORS.INVALID_PAYLOAD, { req }))
        }

        const originalAttachments = fileRecord.attachments?.attachments


        const newAttachment = {
            modelName, id: itemId, fileClientId: fileClientId, user: { id: user.id },
        }
        const resultAttachments = Array.isArray(originalAttachments)
            ? [...originalAttachments, newAttachment]
            : [newAttachment]

        const file = await FileRecord.update(context, fileRecord.id, {
            dv, sender,
            attachments: {
                attachments: resultAttachments,
            },
        }, `id fileMeta ${FILE_RECORD_PUBLIC_META_FIELDS}`)
        const appClient = appClients[fileClientId]

        // Return full public meta for file. It's finally can save to the database at the client / application side
        res.json({
            data: {
                file: {
                    signature: jwt.sign(
                        file.fileMeta,
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
    validateFileUploadSignature,
    RedisGuard,

    // handlers
    authHandler,
    rateLimitHandler,
    parserHandler,
    fileStorageHandler,
    fileShareHandler,
    fileAttachHandler,

    __test__: {
        MetaSchema,
        SharePayloadSchema,
        FileAttachSchema,
        InlineAttachPayloadSchema,
    },
}
