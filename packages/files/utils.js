const busboy = require('busboy')
const cuid = require('cuid')
const { WriteStream } = require('fs-capacitor')
const jwt = require('jsonwebtoken')
const { validate: validateUUID } = require('uuid')
const { z } = require('zod')

const { File } = require('@open-condo/files/schema/utils/serverSchema')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('file-middleware')

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

const FINGERPRINT_RE = /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/

function sendError (res, status, message) {
    logger.error({ msg: message })
    res.status(status).json({ error: message })
}

function extractRequestIp (req) {
    return String(req.ip || '').split(':').pop()
}

// ---------------------- guards ----------------------

class RedisGuard {
    constructor () {
        this.counterPrefix = 'guard_counter:'
    }

    get redis () {
        if (!this._redis) this._redis = getKVClient('guards')
        return this._redis
    }

    async incrementHourCounter (variable) {
        return this.incrementCustomCounter(variable, 3600)
    }

    async incrementCustomCounter (variable, ttl) {
        let afterIncrement = await this.redis.incr(`${this.counterPrefix}${variable}`)
        afterIncrement = Number(afterIncrement)
        if (afterIncrement === 1) {
            await this.redis.expire(`${this.counterPrefix}${variable}`, ttl)
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

function parseAndValidateMeta (raw, req, res, onError) {
    let candidate = raw
    if (typeof raw === 'string') {
        try {
            candidate = JSON.parse(raw)
        } catch {
            return onError(() => sendError(res, 400, 'Invalid type for the "meta" multipart field'))
        }
    } else if (typeof raw !== 'object' || raw === null) {
        return onError(() => sendError(res, 400, 'Invalid type for the "meta" multipart field'))
    }

    const result = MetaSchema.safeParse(candidate)
    if (!result.success) {
        const msg = result.error.issues[0]?.message || 'Invalid meta'
        return onError(() => sendError(res, 400, msg))
    }

    const meta = result.data
    if (!validateUUID(meta.authedItem)) {
        return onError(() => sendError(res, 400, 'Invalid uuid'))
    }

    if (meta.authedItem !== req.user.id) {
        return onError(() => sendError(res, 403, 'Wrong authedItem. Unable to upload file for another user'))
    }

    return meta
}
// ---------------------- handlers ----------------------

const authHandler = () => async (req, res, next) => {
    if (!req.user || req.user.deletedAt !== null) {
        logger.error({ msg: 'auth handler error' })
        return res.status(403).json({ error: 'Authorization is required' })
    }
    next()
}

const rateLimitHandler = ({ quota, guard }) => async (req, res, next) => {
    const requestIp = extractRequestIp(req)
    const userId = req.user.id

    const idCounter = await guard.incrementHourCounter(`file:${userId}`)
    if (idCounter > quota.user) {
        return res.status(429).json({ error: 'You have reached the request limit, try again later.' })
    }

    const ipCounter = await guard.incrementHourCounter(`file:${requestIp}`)
    if (ipCounter > quota.ip) {
        return res.status(429).json({ error: 'You have reached the request limit, try again later.' })
    }

    next()
}

const parserHandler = ({ processRequestOptions }) => {
    return async function (req, res, next) {
        if (!req.is('multipart/form-data')) {
            return res.status(405).json({ error: 'Wrong request method type. Only "multipart/form-data" is allowed' })
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
            exit(() => sendError(res, 500, 'unable to parse file content'))
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
                sendError(res, 413, `File truncated as it exceeds the ${processRequestOptions.maxFileSize} byte size limit.`)
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
            exit(() => sendError(res, 413, `${processRequestOptions.maxFiles} max file uploads exceeded.`))
        )

        parser.on('field', (fieldName, value, { valueTruncated }) => {
            if (valueTruncated) {
                return exit(() =>
                    sendError(res, 413, `The ‘${fieldName}’ multipart field value exceeds the ${processRequestOptions.maxFieldSize} byte size limit.`)
                )
            }

            if (fieldName === 'meta') {
                meta = parseAndValidateMeta(value, req, res, exit)
            }

            req.meta = meta
        })

        parser.once('finish', () => {
            req.unpipe(parser)
            req.resume()

            if (!Array.isArray(req.files)) {
                return exit(() => sendError(res, 400, 'Missing attached files'))
            }
            if (!meta) {
                return exit(() => sendError(res, 400, 'Missing multipart field "meta"'))
            }
            next()
        })

        req.once('close', () => {
            if (!req.readableEnded) {
                exit(() => sendError(res, 499, 'Request disconnected during file upload stream parsing.'))
            }
        })

        res.once('close', () => { released = true })
        req.pipe(parser)
    }
}

const fileStorageHandler = ({ keystone, appClients }) => {
    return async function (req, res) {
        const { meta, files } = req
        const appClient = appClients ? appClients[meta.appId] : undefined

        if (!(meta['appId'] in (appClients || {}))) {
            return res.status(403).json({ error: `${meta['appId']} does not have permission to upload files` })
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
                    meta,
                })
            )
        )

        const condoFiles = await File.createMany(
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
    extractRequestIp,
    parseAndValidateMeta,
    RedisGuard,

    // handlers
    authHandler,
    rateLimitHandler,
    parserHandler,
    fileStorageHandler,

    // test-only surface
    __test__: {
        parseAndValidateMeta,
        extractRequestIp,
        MetaSchema,
    },
}
