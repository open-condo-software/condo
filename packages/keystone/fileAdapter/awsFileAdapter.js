const path = require('path')

const { getItem, getItems } = require('@open-keystone/server-side-graphql-client')
const AWS = require('aws-sdk')
const express = require('express')
const jwt = require('jsonwebtoken')
const { get, isEmpty, isString, isNil } = require('lodash')

const conf = require('@open-condo/config')
const { SERVER_URL, AWS_CONFIG } = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { UUID_REGEXP } = require('./constants')

const logger = getLogger('aws-s3-file-adapter')
const PUBLIC_URL_TTL = 60 * 60 * 24 * 7 // 1 WEEK IN SECONDS FOR ANY PUBLIC URL
const NO_SET_CONTENT_DISPOSITION_FOLDERS = ['marketitemfile'] // files to be opened in a new window by clicking on a link

class AwsS3Acl {
    constructor (config) {
        if (!isEmpty(config.bucket)) {
            this.bucket = config.bucket
            this.s3 = new AWS.S3(config.s3Options)
        } else {
            console.error('[error] AWS is not configured')
        }
    }

    async getMeta (filename) {
        const result = await this.s3.headObject({
            Bucket: this.bucket,
            Key: filename,
        }).promise()

        if (result?.Metadata) {
            return result.Metadata
        } else {
            return {}
        }
    }

    async setMeta (filename, newMeta = {}) {
        try {
            await this.s3.copyObject({
                Bucket: this.bucket,
                CopySource: `/${this.bucket}/${filename}`,
                Key: filename,
                Metadata: newMeta,
                MetadataDirective: 'REPLACE',
            }).promise()
            return true
        } catch (err) {
            return false
        }
    }

    generateUrl ({ filename, ttl = 300, originalFilename }) {
        const params = {
            Bucket: this.bucket,
            Key: filename,
            Expires: ttl,
        }
        if (!isNil(originalFilename)) {
            params.ResponseContentDisposition = `attachment; filename="${encodeURIComponent(originalFilename)}"`
        }
        return this.s3.getSignedUrl('getObject', params)
    }
}

class AwsFileAdapter {
    constructor (config) {
        this.bucket = config.bucket
        this.s3 = new AWS.S3(config.s3Options)
        this.folder = config.folder
        this.shouldResolveDirectUrl = config.isPublic
        this.saveFileName = config.saveFileName
        this.acl = new AwsS3Acl(config)
    }

    async save ({ stream, filename, id, mimetype, encoding, meta = {} }) {
        const fileData = {
            id,
            originalFilename: filename,
            filename: this.saveFileName ? filename : this.getFilename({ id, originalFilename: filename }),
            mimetype,
            encoding,
        }
        const key = `${this.folder}/${fileData.filename}`
        const uploadParams = this.uploadParams({ ...fileData, meta })
        try {
            const data = await this.s3.upload({
                Body: stream,
                ContentType: mimetype,
                Bucket: this.bucket,
                Key: key,
                ...uploadParams,
            }).promise()
            stream.destroy()
            return { ...fileData, _meta: data }
        } catch (error) {
            stream.destroy()
            throw error
        }
    }

    delete (file, options = {}) {
        if (file) {
            return this.s3
                .deleteObject({
                    Bucket: this.bucket,
                    Key: `${this.folder}/${file.filename}`,
                    ...options,
                }).promise()
        }
        return Promise.reject(new Error('Missing required argument file.'))
    }

    getFilename ({ id, originalFilename }) {
        const forbiddenCharacters = /[^a-z0-9.+-]+/ig
        return `${id}${path.extname(originalFilename).replace(forbiddenCharacters, '')}`
    }

    publicUrl ({ filename, originalFilename, ...props }, user) {
        let folder = this.folder
        let sign
        if ('meta' in props && props['meta']['fileClientId']) {
            folder = props['meta']['sourceFileClientId'] || props['meta']['fileClientId']
            if (!conf['FILE_SECRET']) {
                throw new Error('FILE_SECRET is not configured')
            }
            sign = jwt.sign({ id: props.id, filename, fileClientId: folder, user }, conf['FILE_SECRET'], { expiresIn: '1h', algorithm: 'HS256' })
        }

        if (this.shouldResolveDirectUrl) {
            return this.acl.generateUrl({
                filename: `${folder}/${filename}`,
                ttl: PUBLIC_URL_TTL,
                originalFilename,
            })
        }
        let qs = ''

        const searchParams = new URLSearchParams({
        // propagate original filename for an indirect url
            ...((isNil(originalFilename) || NO_SET_CONTENT_DISPOSITION_FOLDERS.includes(folder))
          && { original_filename: encodeURIComponent(originalFilename) }),
            ...(sign && { sign }),
        }).toString()

        if (searchParams) {
            qs = `?${searchParams}`
        }

        return `${SERVER_URL}/api/files/${folder}/${filename}${qs}`
    }

    uploadParams ({ meta = {} }) {
        return { Metadata: meta }
    }
}

const awsRouterHandler = ({ keystone }) => {
    const s3Config = AWS_CONFIG ? JSON.parse(AWS_CONFIG) : {}
    const acl = new AwsS3Acl(s3Config)

    const appClients = conf['FILE_UPLOAD_CONFIG'] ? get(JSON.parse(conf['FILE_UPLOAD_CONFIG']), 'clients', {}) : {}

    return async function (req, res, next) {
        if (!req.user) {
            res.status(403).end()
            return
        }
        try {
            const meta = await acl.getMeta(req.params.file)
            if (isEmpty(meta)) {
                res.status(404).end()
                return
            }

            const hasSign = typeof req.query?.sign === 'string' && req.query.sign.length > 0

            if (!hasSign) {
                const {
                    id: itemId,
                    ids: stringItemIds,
                    listkey: listKey,
                    propertyquery: encodedPropertyQuery,
                    propertyvalue: encodedPropertyValue,
                } = meta
                const propertyQuery = !isNil(encodedPropertyQuery) ? decodeURI(encodedPropertyQuery) : null
                const propertyValue = !isNil(encodedPropertyValue) ? decodeURI(encodedPropertyValue) : null

                if ((isEmpty(itemId) && isEmpty(stringItemIds)) || isEmpty(listKey)) {
                    res.status(404).end()
                    return
                }

                const context = await keystone.createContext({ authentication: { item: req.user, listKey: 'User' } })
                let hasAccessToReadFile

                if (!isEmpty(stringItemIds) && isString(stringItemIds)) {
                    const itemIds = stringItemIds.split(',').filter(id => UUID_REGEXP.test(id))
                    const items = await getItems({
                        keystone,
                        listKey,
                        itemId,
                        context,
                        where: { id_in: itemIds, deletedAt: null },
                    })
                    hasAccessToReadFile = items.length > 0
                }

                if (itemId && !hasAccessToReadFile) {
                    let returnFields = 'id'
                    if (isString(propertyQuery)) {
                        returnFields += `, ${propertyQuery}`
                    }
                    const item = await getItem({
                        keystone,
                        listKey,
                        itemId,
                        context,
                        returnFields,
                    })
                    hasAccessToReadFile = !isNil(item)
                    if (hasAccessToReadFile && isString(propertyQuery) && !isNil(propertyValue)) {
                        const propertyPath = propertyQuery
                            .replaceAll('}', '')
                            .split('{')
                            .map(path => path.trim())
                            .join('.')
                        hasAccessToReadFile = get(item, propertyPath) == propertyValue
                    }
                }

                if (!hasAccessToReadFile) {
                    res.status(403).end()
                    return
                }
                const url = acl.generateUrl({
                    filename: req.params.file,
                    originalFilename: req.query.original_filename,
                })
                if (req.get('shallow-redirect')) {
                    res.status(200).json({ redirectUrl: url })
                    return
                }

                return res.redirect(url)
            } else {
                const pathArgs = req.path.split('/')
                const appId = pathArgs[pathArgs.length - 2]
                const { sign } = req.query

                if (!(appId in appClients)) {
                    res.status(404)
                    return res.end()
                }

                try {
                    jwt.verify(sign, appClients[appId].secret, { algorithms: ['HS256'] })
                } catch (e) {
                    res.status(410)
                    return res.end()
                }

                const url = this.acl.generateUrl({
                    filename: req.params.file,
                    originalFilename: req.query.original_filename,
                })

                if (req.get('shallow-redirect')) {
                    res.status(200)
                    return res.json({ redirectUrl: url })
                }

                return res.redirect(url)
            }
        } catch (err) {
            logger.error({ msg: 's3 route handler error', err })
            res.status(500)
            return res.end()
        }
    }
}

class AWSFilesMiddleware {
    prepareMiddleware ({ keystone }) {
        // this route does not have any system change operation and used only for serving files to end user browser
        // this mean no csrf attacking possible - since no data change operation going to be made by opening a link
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use('/api/files/:file(*)', awsRouterHandler({ keystone }))
        return app
    }
}

module.exports = {
    AwsFileAdapter,
    AWSFilesMiddleware,
    awsRouterHandler,
}
