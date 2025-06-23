const busboy = require('busboy')
const cuid = require('cuid')
const express = require('express')
const { WriteStream } = require('fs-capacitor')
const { validate } = require('uuid')

const { CondoFile } = require('@open-condo/files/schema/utils/serverSchema')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getKVClient } = require('@open-condo/keystone/kv')


class RedisGuard {
    constructor () {
        this.lockPrefix = 'guard_lock:'
        this.counterPrefix = 'guard_counter:'
    }

    get redis () {
        if (!this._redis) this._redis = getKVClient('guards')
        return this._redis
    }

    async isLocked (variable, action = '') {
        const actionFolder = action ? `${action}:` : ''
        const value = await this.redis.exists(`${this.lockPrefix}${actionFolder}${variable}`)
        return !!value
    }

    async lockTimeRemain (variable, action = '') {
        const actionFolder = action ? `${action}:` : ''
        const time = await this.redis.ttl(`${this.lockPrefix}${actionFolder}${variable}`)
        return Math.max(time, 0)
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

const fileStorageHandler = ({ keystone, fileAdapter }) => {
    return async function (request, response) {
        const context = keystone.createContext({ skipAccessControl: true })
        const savedFiles = await Promise.all(request.files.map(file => fileAdapter.save({
            stream: file.stream,
            filename: file.filename,
            mimetype: file.mimetype,
            encoding: file.encoding,
            id: cuid(),
            meta: request.meta,
        })))

        const condoFiles = await CondoFile.createMany(context, savedFiles.map((data, index) => ({
            data: {
                file: {
                    ...data,
                    storage_id: data.id,
                    originalFilename: request.files[index].filename,
                    mimetype: request.files[index].mimetype,
                    encoding: request.files[index].encoding,
                    meta: request.meta,
                },
                dv: request.meta.dv,
                sender: request.meta.sender,
            },
        })))

        response.json(condoFiles)
    }
}

const rateLimitHandler = ({ quotas, guard }) => {
    return async function (request, response, next) {
        const requestIp = request.ip.split(':').pop()
        const userId = request.user.id

        const idCounter = await guard.incrementHourCounter(`file:${userId}`)
        if (idCounter > quotas.userQuota) {
            return response.status(429).json({ error: 'You are reach request limit, try again later.' })
        }

        const ipCounter = await guard.incrementHourCounter(`file:${requestIp}`)
        if (ipCounter > quotas.ipQuota) {
            return response.status(429).json({ error: 'You are reach request limit, try again later.' })
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
        userQuota = 100,
        ipQuota = 100,
    }) {
        this.apiUrl = apiUrl
        this.processRequestOptions = { maxFieldSize, maxFileSize, maxFiles }
        this.adapter = new FileAdapter('files')
        this.quotas = { userQuota, ipQuota }
    }

    prepareMiddleware ({ keystone }) {
        // creates middleware - no routes exposed
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const processRequestOptions = this.processRequestOptions
        const fileAdapter = this.adapter
        const guard = new RedisGuard()
        const quotas = this.quotas

        app.use(
            this.apiUrl,
            // Authorization checks
            function (request, response, next) {
                // const sendUnauthorizedStatus = () => {
                //     response.sendStatus(403)
                //     response.end()
                // }

                if (!request.user) {
                    return response.status(403).json({ error: 'Authorization is required' })
                    // sendUnauthorizedStatus()
                }

                next()

                // const context = keystone.createContext({ authentication: { item: request.user, listKey: 'User' } })

                // const authHeader = request.headers.authorization || request.headers.Authorization
                // if (!authHeader) {
                //     sendUnauthorizedStatus()
                // }
                //
                // const [type, token] = authHeader.split(' ')
                // if (!type || !token) {
                //     sendUnauthorizedStatus()
                // }
                //
                // if (type !== 'Bearer') {
                //     sendUnauthorizedStatus()
                // }
                //
                // kvClient.get(`sess:${token.split('.')[0]}`).then(token => {
                //     if (token) {
                //         next()
                //     } else {
                //         sendUnauthorizedStatus()
                //     }
                // }).catch(() => sendUnauthorizedStatus())
            },

            rateLimitHandler({ keystone, quotas, guard }),
            // Payload checks
            function (request, response, next) {
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

                                if (!meta.appId) {
                                    return exit(() =>
                                        createError(400, 'Missing appId field for meta object', response)
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
                    return response.status(405).json({ error: 'Wrong request type. Only "multipart/form-data" is allowed' })
                }
            },
            fileStorageHandler({ keystone, fileAdapter }),
        )
        return app
    }
}

module.exports = { FileMiddleware }
