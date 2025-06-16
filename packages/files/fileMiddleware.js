const busboy = require('busboy')
const cuid = require('cuid')
const express = require('express')
const { WriteStream } = require('fs-capacitor')
const createError = require('http-errors')
const { pick, isEqual } = require('lodash')
// const mongoose = require('mongoose')

const { CondoFile } = require('@open-condo/files/schema/utils/serverSchema')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

// mongoose.set('objectIdGetter', false)


class FileMiddleware {
    constructor ({
        apiUrl = '/api/files/upload',
        maxFieldSize = 200 * 1024 * 1024,
        maxFileSize = 200 * 1024 * 1024,
        maxFiles = 2,
        requiredMetaFields = ['user', 'organization'],
    }) {
        this.apiUrl = apiUrl
        this.processRequestOptions = { maxFieldSize, maxFileSize, maxFiles }
        this.adapter = new FileAdapter('files')
        this.requiredMetaFields = requiredMetaFields
    }

    prepareMiddleware ({ keystone }) {
        // creates middleware - no routes exposed
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const processRequestOptions = this.processRequestOptions
        const fileAdapter = this.adapter
        const requiredMetaFields = this.requiredMetaFields

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

                    const exit = (error, isParserError = false) => {
                        if (exitError) return

                        exitError = error
                        isParserError ? parser.destroy() : parser.destroy(exitError)
                        request.unpipe(parser)
                        setImmediate(() => {
                            request.resume()
                        })

                        next(exitError)
                    }

                    parser.on('error', (/** @type {Error} */ error) => {
                        exit(error, true)
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
                            fileError = createError(
                                413,
                                `File truncated as it exceeds the ${processRequestOptions.maxFileSize} byte size limit.`
                            )
                            stream.unpipe()
                            capacitor.destroy(fileError)
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
                        exit(createError(413, `${processRequestOptions.maxFiles} max file uploads exceeded.`))
                    )
                    parser.on('field', (fieldName, value, { valueTruncated }) => {
                        if (valueTruncated) {
                            return exit(
                                createError(413, `The ‘${fieldName}’ multipart field value exceeds the ${processRequestOptions.maxFieldSize} byte size limit.`)
                            )
                        }

                        switch (fieldName) {
                            case 'meta':
                                try {
                                    meta = pick(JSON.parse(value), requiredMetaFields)
                                } catch (e) {
                                    return exit(
                                        createError(400, 'Invalid type for the "meta" multipart field')
                                    )
                                }


                                if (!Object.values(meta).every(value => !!value) || !isEqual(Object.keys(meta).sort(), requiredMetaFields.sort())) {
                                    return exit(
                                        createError(400, `Invalid data for file meta. Required fields ${requiredMetaFields.join(', ')} should be not empty`),
                                    )
                                }
                        }
                        request.meta = meta
                    })
                    parser.once('finish', () => {
                        request.unpipe(parser)
                        request.resume()
                        if (!Array.isArray(request.files)) {
                            return exit(
                                createError(
                                    400,
                                    'Missing attached files'
                                )
                            )
                        }
                        if (!meta) {
                            return exit(
                                createError(
                                    400,
                                    'Missing multipart field "meta"'
                                )
                            )
                        }

                        next()
                    })
                    request.once('close', () => {
                        if (!request.readableEnded)
                            exit(
                                createError(
                                    499,
                                    'Request disconnected during file upload stream parsing.'
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
                }))).then(savedFiles => {
                    CondoFile.createMany(context, savedFiles.map((data, index) => ({
                        data: {
                            file: {
                                ...data,
                                originalFilename: request.files[index].filename,
                                mimetype: request.files[index].mimetype,
                                encoding: request.files[index].encoding,
                            },
                            meta: request.meta,
                            dv: 1,
                            sender: { dv: 1, fingerprint: 'condo-file-middleware' },
                        },
                    }))).then(savedFiles => {
                        response.json({ savedFiles })
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
