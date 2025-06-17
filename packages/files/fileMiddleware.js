const busboy = require('busboy')
const cuid = require('cuid')
const express = require('express')
const { WriteStream } = require('fs-capacitor')

const { CondoFile } = require('@open-condo/files/schema/utils/serverSchema')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

function createError (status, message, response) {
    response.status(status).json({ error: message })
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
    }

    prepareMiddleware ({ keystone }) {
        // creates middleware - no routes exposed
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const processRequestOptions = this.processRequestOptions
        const fileAdapter = this.adapter

        app.use(
            this.apiUrl,
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
                        exit(() => createError(500, 'unable to parse file content'), true)
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
                    next()
                }
            },
            function (request, response) {
                const context = keystone.createContext({ skipAccessControl: true })

                Promise.all(request.files.map(file => fileAdapter.save({
                    stream: file.stream,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    encoding: file.encoding,
                    id: cuid(),
                    meta: request.meta,
                }))).then(savedFiles => {
                    // response.json(savedFiles.map(adapterFile => ({ ...adapterFile, meta: request.meta })))
                    CondoFile.createMany(context, savedFiles.map((data, index) => ({
                        data: {
                            file: {
                                ...data,
                                originalFilename: request.files[index].filename,
                                mimetype: request.files[index].mimetype,
                                encoding: request.files[index].encoding,
                                meta: request.meta,
                            },
                            dv: request.meta.dv,
                            sender: request.meta.sender,
                        },
                    }))
                    ).then(savedFiles => {
                        response.json(savedFiles)
                    }).catch(error => {
                        response.json({ error })
                    })
                }).catch(error => {
                    response.json({ error })
                })
            }
        )
        return app
    }
}

module.exports = { FileMiddleware }
