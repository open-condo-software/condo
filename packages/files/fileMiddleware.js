const Ajv = require('ajv')
const busboy = require('busboy')
const cuid = require('cuid')
const express = require('express')
const { WriteStream } = require('fs-capacitor')
const jwt = require('jsonwebtoken')
const { validate } = require('uuid')

const conf = require('@open-condo/config')
const { CondoFile } = require('@open-condo/files/schema/utils/serverSchema')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getKVClient } = require('@open-condo/keystone/kv')

const DEFAULT_USER_QUOTA = 100
const DEFAULT_IP_QUOTA = 100
const ajv = new Ajv()

const validateAppClientSchema = ajv.compile({
    type: 'object',
    patternProperties: {
        '^[a-zA-Z0-9-]+$': {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 3 },
                modelNames: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1,
                },
                secret: { 'type': 'string', minLength: 8 },
            },
            additionalProperties: false,
            required: ['name', 'secret'],
        },
    },
    additionalProperties: false,
})


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


function createError (status, message, response) {
    response.status(status).json({ error: message })
}

const parserHandler = ({ keystone, processRequestOptions  }) => {
    return async function (request, response, next) {
        if (request.is('multipart/form-data')) {
            let exitError, released, meta

            const requestEnd = new Promise((resolve) => request.on('end', resolve))
            const { send } = response

            response.send = (...args) => {
                requestEnd.then(() => {
                    response.send = send
                    response.send(...args)
                })
            }

            const parser = busboy({
                headers: request.headers,
                limits: {
                    fieldSize: processRequestOptions.maxFieldSize,
                    fields: 2,
                    fileSize: processRequestOptions.maxFileSize,
                    files: processRequestOptions.maxFiles,
                },
            })

            const exit = (exitWithError) => {
                if (exitError) return

                exitError = exitWithError
                parser.destroy()
                request.unpipe(parser)
                setImmediate(() => {
                    request.resume()
                })

                exitWithError()
            }

            parser.on('error', (/** @type {Error} */ error) => {
                exit(() => createError(500, 'unable to parse file content', response))
            })

            parser.on('file', (fieldName, stream, { filename, encoding, mimeType: mimetype }) => {
                /** @type {Error} */
                let fileError

                const capacitor = new WriteStream()

                capacitor.on('error', () => {
                    stream.unpipe()
                    stream.resume()
                })

                stream.on('limit', () => {
                    stream.unpipe()
                    capacitor.destroy(fileError)
                    createError(
                        413,
                        `File truncated as it exceeds the ${processRequestOptions.maxFileSize} byte size limit.`, response
                    )
                })

                stream.on('error', (error) => {
                    fileError = error
                    stream.unpipe()
                    capacitor.destroy(fileError)
                })

                /** @type {FileUpload} */
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
                if (!Array.isArray(request.files)) {
                    request.files = [file]
                } else {
                    request.files.push(file)
                }
            })
            parser.once('filesLimit', () =>
                exit(() => createError(413, `${processRequestOptions.maxFiles} max file uploads exceeded.`, response))
            )
            parser.on('field', (fieldName, value, { valueTruncated }) => {
                if (valueTruncated) {
                    return exit(() =>
                        createError(413, `The ‘${fieldName}’ multipart field value exceeds the ${processRequestOptions.maxFieldSize} byte size limit.`, response)
                    )
                }

                switch (fieldName) {
                    case 'meta':
                        if (typeof value === 'string') {
                            try {
                                meta = JSON.parse(value)
                            } catch (e) {
                                return exit(() =>
                                    createError(400, 'Invalid type for the "meta" multipart field', response)
                                )
                            }
                        } else if (typeof value !== 'object') {
                            return exit(() =>
                                createError(400, 'Invalid type for the "meta" multipart field', response)
                            )
                        } else {
                            meta = value
                        }

                        if (typeof meta.dv !== 'number') {
                            return exit(() =>
                                createError(400, 'Missing dv field for meta object', response)
                            )
                        }

                        if (typeof meta.sender !== 'object') {
                            return exit(() =>
                                createError(400, 'Missing sender field for meta object', response)
                            )
                        }

                        if (typeof meta.sender.dv !== 'number' || typeof meta.sender.fingerprint !== 'string') {
                            return exit(() =>
                                createError(400, 'Wrong sender field data. Correct format is { "dv": 1, "fingerprint": "uniq-device-or-container-id" }', response)
                            )
                        }

                        if (meta.dv !== 1 || meta.sender.dv !== 1) {
                            return exit(() =>
                                createError(400, 'Wrong value for data version number', response)
                            )
                        }

                        if (!/^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/.test(meta.sender.fingerprint)) {
                            return exit(() =>
                                createError(400, 'Wrong sender.fingerprint value provided', response)
                            )
                        }

                        if (!meta.authedItem) {
                            return exit(() =>
                                createError(400, 'Missing authedItem field for meta object', response)
                            )
                        }

                        if (!validate(meta.authedItem)) {
                            return exit(() =>
                                createError(400, 'Wrong authedItem value provided', response)
                            )
                        }

                        if (meta.authedItem !== request.user.id) {
                            return exit(() =>
                                createError(403, 'Wrong authedItem. Unable to upload file for another user', response)
                            )
                        }

                        if (!meta.appId) {
                            return exit(() =>
                                createError(400, 'Missing appId field for meta object', response)
                            )
                        }

                        if (!meta.modelNames) {
                            return exit(() =>
                                createError(400, 'Missing modelNames field for meta object', response)
                            )
                        }
                }
                request.meta = meta
            })
            parser.once('finish', () => {
                request.unpipe(parser)
                request.resume()
                if (!Array.isArray(request.files)) {
                    return exit(() =>
                        createError(
                            400,
                            'Missing attached files',
                            response
                        )
                    )
                }
                if (!meta) {
                    return exit(() =>
                        createError(
                            400,
                            'Missing multipart field "meta"',
                            response
                        )
                    )
                }

                next()
            })
            request.once('close', () => {
                if (!request.readableEnded)
                    exit(() =>
                        createError(
                            499,
                            'Request disconnected during file upload stream parsing.',
                            response
                        )
                    )
            })
            response.once('close', () => {
                released = true
            })
            request.pipe(parser)
        } else {
            return response.status(405).json({ error: 'Wrong request method type. Only "multipart/form-data" is allowed' })
        }
    }
}

const fileStorageHandler = ({ keystone, fileAdapter, appClients }) => {
    return async function (request, response) {
        // Check provided app client exists
        const { meta, files } = request

        const appClient = appClients[meta.appId]

        if (!(meta['appId'] in appClients)) {
            return response.status(403).json({ error: `${meta['appId']} does not have permission to upload files` })
        }

        const context = keystone.createContext({ skipAccessControl: true })
        const savedFiles = await Promise.all(files.map(file => fileAdapter.save({
            stream: file.stream,
            filename: file.filename,
            mimetype: file.mimetype,
            encoding: file.encoding,
            id: cuid(),
            meta,
        })))

        const condoFiles = await CondoFile.createMany(context, savedFiles.map((data, index) => {
            const fileData = {
                ...data,
                originalFilename: files[index].filename,
                mimetype: files[index].mimetype,
                encoding: files[index].encoding,
                meta,
            }

            const signature = jwt.sign(fileData, appClient.secret)

            return {
                data: {
                    file: fileData,
                    dv: meta.dv,
                    sender: meta.sender,
                    signature,
                    user: { connect: { id: request.user.id } },
                },
            }
        }), 'id signature')

        response.json(condoFiles)
    }
}

const rateLimitHandler = ({ quota, guard }) => {
    return async function (request, response, next) {
        const requestIp = request.ip.split(':').pop()
        const userId = request.user.id

        const idCounter = await guard.incrementHourCounter(`file:${userId}`)
        if (idCounter > quota.user) {
            return response.status(429).json({ error: 'You are reach request limit, try again later.' })
        }

        const ipCounter = await guard.incrementHourCounter(`file:${requestIp}`)
        if (ipCounter > quota.ip) {
            return response.status(429).json({ error: 'You are reach request limit, try again later.' })
        }

        next()
    }
}

const authHandler = ({ keystone }) => {
    return async function (request, response, next) {
        if (!request.user || request.user.deletedAt !== null) {
            return response.status(403).json({ error: 'Authorization is required' })
        }

        next()
    }
}

class FileMiddleware {
    constructor ({
        apiUrl = '/api/files/upload',
        maxFieldSize = 200 * 1024 * 1024,
        maxFileSize = 200 * 1024 * 1024,
        maxFiles = 2,
    }) {
        this.apiUrl = apiUrl
        this.processRequestOptions = { maxFieldSize, maxFileSize, maxFiles }
        this.adapter = new FileAdapter('files')
        let quota, appClients
        try {
            const parsedConfig = JSON.parse(conf['FILE_QUOTA'])
            if (parsedConfig.user > 0 && parsedConfig.ip > 0) {
                quota = parsedConfig
            }
        } catch (e) {
            quota = { user: DEFAULT_USER_QUOTA, ip: DEFAULT_IP_QUOTA }
        }
        if (!conf['FILE_APP_CLIENTS']) {
            console.warn('File - app access control disabled')
        } else {
            try {
                const parsedAppClients = JSON.parse(conf['FILE_APP_CLIENTS'])
                validateAppClientSchema(parsedAppClients)

                if (!ajv.errors) {
                    appClients = parsedAppClients
                }

            } catch (e) {
                if (ajv.errors) {
                    throw new Error(ajv.errors)
                }
                throw new Error('Unable to parse required FILE_APP_CLIENTS json from environment')
            }
        }

        this.quota = quota
        this.appClients = appClients
    }

    prepareMiddleware ({ keystone }) {
        // creates middleware - no routes exposed
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const processRequestOptions = this.processRequestOptions
        const fileAdapter = this.adapter
        const guard = new RedisGuard()
        const quota = this.quota
        const appClients = this.appClients

        app.post(
            this.apiUrl,
            authHandler({ keystone }),
            rateLimitHandler({ keystone, quota, guard }),
            parserHandler({ keystone, processRequestOptions }),
            fileStorageHandler({ keystone, fileAdapter, appClients }),
        )
        return app
    }
}

module.exports = { FileMiddleware }
