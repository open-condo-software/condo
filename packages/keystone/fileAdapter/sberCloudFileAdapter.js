const path = require('path')

const { getItem, getItems } = require('@open-keystone/server-side-graphql-client')
const ObsClient = require('esdk-obs-nodejs')
const express = require('express')
const jwt = require('jsonwebtoken')
const { get, isEmpty, isString, isNil } = require('lodash')

const { SERVER_URL, SBERCLOUD_OBS_CONFIG } = require('@open-condo/config')
const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { UUID_REGEXP } = require('./constants')


const logger = getLogger('cloud-ru-file-adapter')
const PUBLIC_URL_TTL = 60 * 60 * 24 * 30 // 1 MONTH IN SECONDS FOR ANY PUBLIC URL

const SAFE_INLINE_MIMETYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp', 'image/x-icon',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
]

class SberCloudObsAcl {
    constructor (config) {
        if (!isEmpty(config.bucket)) {
            this.bucket = config.bucket
            this.s3 = new ObsClient(config.s3Options)
            this.server = config.s3Options.server
        } else {
            console.error('[error] OBS is not configured')
        }
    }

    async getMeta (filename) {
        const result  = await this.s3.getObjectMetadata({
            Bucket: this.bucket,
            Key: filename,
        })
        if (result.CommonMsg.Status < 300) {
            return {
                ...(result?.InterfaceResult?.Metadata || {}),
                mimetype: result?.InterfaceResult?.ContentType,
            }
        } else {
            return {}
        }
    }

    async setMeta (filename, newMeta = {} ) {
        const result = await this.s3.setObjectMetadata({
            Bucket: this.bucket,
            Key: filename,
            Metadata: newMeta,
            MetadataDirective: 'REPLACE_NEW',
        })
        const  { CommonMsg: { Status } } = result
        return Status < 300
    }

    /**
     * createSignedUrlSync is executed without request to obs, so there is no need to cache result
     * @param {string} filename should starts from the folder if exists (`${adapter.folder}/${filename}`)
     * @param {number} ttl
     * @param {string} originalFilename filename going to be appeared for end user
     * @param {string} mimetype file mimetype
     * @returns {string}
     */
    generateUrl ({ filename, ttl = 300, originalFilename, mimetype }) { // obs default
        const isSafeInline = SAFE_INLINE_MIMETYPES.includes(mimetype)
        const extraParams = (!isSafeInline && originalFilename) ? {
            QueryParams: {
                'response-content-disposition': `attachment; filename="${encodeURIComponent(originalFilename)}"`,
            },
        } : {}

        const { SignedUrl } = this.s3.createSignedUrlSync({
            Method: 'GET',
            Bucket: this.bucket,
            Key: filename,
            Expires: ttl,
            ...extraParams,
        })
        return SignedUrl
    }

}

class SberCloudFileAdapter {
    constructor (config) {
        this.bucket = config.bucket
        this.s3 = new ObsClient(config.s3Options)
        this.server = config.s3Options.server
        this.folder = config.folder
        this.shouldResolveDirectUrl = config.isPublic
        this.saveFileName = config.saveFileName
        this.acl = new SberCloudObsAcl(config)
    }

    errorFromCommonMsg ({ CommonMsg: { Status, Message } }) {
        if (Status > 300) {
            return new Error(Message)
        }
        return null
    }

    save ({ stream, filename, id, mimetype, encoding, meta = {} }) {
        // TODO(dkovyazin): DOMA-7965 Look into redefining fileName inside fileadapter
        const fileData = {
            id,
            originalFilename: filename,
            filename: this.saveFileName ? filename : this.getFilename({ id, originalFilename: filename }),
            mimetype,
            encoding,
        }
        const key = `${this.folder}/${fileData.filename}`
        const saveFile = (resolve, reject) => {
            const uploadParams = this.uploadParams({ ...fileData, meta })
            this.s3.putObject(
                {
                    Body: stream,
                    ContentType: mimetype,
                    Bucket: this.bucket,
                    Key: key,
                    ...uploadParams,
                },
                (error, data) => {
                    error = error || this.errorFromCommonMsg(data)
                    if (error) {
                        reject(error)
                    } else {
                        resolve({ ...fileData, _meta: data })
                    }
                    stream.destroy()
                }
            )
        }

        if (this.saveFileName) {
            return this.acl.getMeta(key)
                .then((existedMeta) => {
                    if (!isEmpty(existedMeta)) {
                        return { ...fileData, _meta: existedMeta }
                    }

                    return new Promise(saveFile)
                })
        }

        return new Promise(saveFile)
    }

    delete (file, options = {}) {
        if (file) {
            return this.s3
                .deleteObject({
                    Bucket: this.bucket,
                    Key: `${this.folder}/${file.filename}`,
                    ...options,
                })
        }
        return Promise.reject(new Error('Missing required argument file.'))
    }

    getFilename ({ id, originalFilename }) {
        const forbiddenCharacters = /[^a-z0-9.+-]+/ig
        return `${id}${path.extname(originalFilename).replace(forbiddenCharacters, '')}` // will skip adding originalFilename
    }

    publicUrl ({ filename, originalFilename, ...props }, user) {
        // It is possible to sign public URL here and to return the signed URL with access token without using middleware.
        // We are using middleware on the following reasons
        // 1. we want file urls to point to our server
        // 2. if we give access token to file here - then the user can face such scenario:
        //    user opens ticket page
        //    then after 5 minutes, he decides to download the file and click on the URL
        //    the token is expired - user needs to reload the page to generate a new access token
        let folder = this.folder
        let sign
        if ('meta' in props && props['meta']['appId']) {
            folder = props['meta']['appId']
            if (!conf['FILE_SECRET']) {
                throw new Error('FILE_SECRET is not configured')
            }
            sign = jwt.sign({ id: props.id, filename, appId: props.meta.appId, user }, conf['FILE_SECRET'], { expiresIn: '1m', algorithm: 'HS256' })
        }
        if (this.shouldResolveDirectUrl) {
            return this.acl.generateUrl({
                filename: `${folder}/${filename}`,
                ttl: PUBLIC_URL_TTL,
                originalFilename,
            })
        }

        // propagate original filename for an indirect url
        let qs = ''
        const searchParams = new URLSearchParams({
            ...(!isNil(originalFilename) && { original_filename: encodeURIComponent(originalFilename) }),
            ...(sign && { sign }),
        }).toString()

        if (searchParams) {
            qs = `?${searchParams}`
        }
        return `${SERVER_URL}/api/files/${this.folder}/${filename}${qs}`
    }

    uploadParams ({ meta = {} }) {
        return {
            Metadata: meta,
        }
    }
}

// Express middleware router to accept links to files
// 1. Checks permissions -  or /403
// 2. Checks that file exists - or /404
// 3. Generates time-limited token to the obs file
// 4. Redirects to obs file with the access token
const obsRouterHandler = ({ keystone }) => {

    const obsConfig = SBERCLOUD_OBS_CONFIG ? JSON.parse(SBERCLOUD_OBS_CONFIG) : {}
    const appClients = conf['FILE_APP_CLIENTS'] ? JSON.parse(conf['FILE_APP_CLIENTS']) : {}
    const Acl = new SberCloudObsAcl(obsConfig)

    return async function (req, res, next) {
        try {
            if (!req.user) {
                res.status(403)
                return res.end()
            }
            const meta = await Acl.getMeta(req.params.file)

            if (isEmpty(meta)) {
                res.status(404)
                return res.end()
            }

            const hasSign = typeof req.query?.sign === 'string' && req.query.sign.length > 0

            // Legacy download
            if (!hasSign) {
                const {
                    id: itemId,
                    ids: stringItemIds,
                    listkey: listKey,
                    propertyquery: encodedPropertyQuery,
                    propertyvalue: encodedPropertyValue,
                    mimetype } = meta
                const propertyQuery = !isNil(encodedPropertyQuery) ? decodeURI(encodedPropertyQuery) : null
                const propertyValue = !isNil(encodedPropertyValue) ? decodeURI(encodedPropertyValue) : null

                if ((isEmpty(itemId) && isEmpty(stringItemIds)) || isEmpty(listKey)) {
                    res.status(404)
                    return res.end()
                }

                const context = await keystone.createContext({ authentication: { item: req.user, listKey: 'User' } })

                let hasAccessToReadFile

                // If user has access to at least one of the objects with this file => user has access to read file
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

                    // for checking property we have to include property name in the return fields list
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

                    // item accessible
                    hasAccessToReadFile = !isNil(item)

                    // check property access case
                    if (hasAccessToReadFile && isString(propertyQuery) && !isNil(propertyValue)) {
                        const propertyPath = propertyQuery
                            .replaceAll('}', '') // remove close brackets of sub props querying
                            .split('{') // work with each path parts separately
                            .map(path => path.trim()) // since gql allow to have spaces in querying - let's remove them
                            .join('.') // join by . for lodash get utility
                        hasAccessToReadFile = get(item, propertyPath) == propertyValue
                    }
                }

                if (!hasAccessToReadFile) {
                    res.status(403)
                    return res.end()
                }
                const url = Acl.generateUrl({
                    filename: req.params.file,
                    originalFilename: req.query.original_filename,
                    mimetype,
                })

                /*
                * NOTE
                * Problem:
                *   In the case of a redirect according to the scheme: A --request--> B --redirect--> C,
                *   it is impossible to read the response of the request.
                *
                * Solution:
                *   When adding the "shallow-redirect" header,
                *   the redirect link to the file comes in json format and a second request is made to get the file.
                *   Thus, the scheme now looks like this: A --request(1)--> B + A --request(2)--> C
                * */
                if (req.get('shallow-redirect')) {
                    res.status(200)
                    return res.json({ redirectUrl: url })
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

                const url = Acl.generateUrl({
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
            // TODO(pahaz): we need to research a better solution here may be we need a 404 or 403
            res.status(500)
            return res.end()
        }
    }
}

class OBSFilesMiddleware {
    prepareMiddleware ({ keystone }) {
        // this route does not have any system change operation and used only for serving files to end user browser
        // this mean no csrf attacking possible - since no data change operation going to be made by opening a link
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.get('/api/files/:file(*)', obsRouterHandler({ keystone }))
        return app
    }
}


module.exports = {
    SberCloudFileAdapter,
    OBSFilesMiddleware,
    obsRouterHandler,
}
