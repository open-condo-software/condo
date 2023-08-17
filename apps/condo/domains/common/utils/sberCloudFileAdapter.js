const path = require('path')

const { getItem, getItems } = require('@keystonejs/server-side-graphql-client')
const ObsClient = require('esdk-obs-nodejs')
const express = require('express')
const { isEmpty, isString } = require('lodash')

const { SERVER_URL, SBERCLOUD_OBS_CONFIG } = require('@open-condo/config')

const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')


const PUBLIC_URL_TTL = 60 * 60 * 24 * 30 // 1 MONTH IN SECONDS FOR ANY PUBLIC URL

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
            return result.InterfaceResult.Metadata
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
     * @returns {string}
     */
    generateUrl (filename, ttl = 300) { // obs default
        const { SignedUrl } = this.s3.createSignedUrlSync({
            Method: 'GET',
            Bucket: this.bucket,
            Key: filename,
            Expires: ttl,
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

    publicUrl ({ filename }) {
        // It is possible to sign public URL here and to return the signed URL with access token without using middleware.
        // We are using middleware on the following reasons
        // 1. we want file urls to point to our server
        // 2. if we give access token to file here - then the user can face such scenario:
        //    user opens ticket page
        //    then after 5 minutes, he decides to download the file and click on the URL
        //    the token is expired - user needs to reload the page to generate a new access token
        if (this.shouldResolveDirectUrl) {
            return this.acl.generateUrl(`${this.folder}/${filename}`, PUBLIC_URL_TTL)
        }
        return `${SERVER_URL}/api/files/${this.folder}/${filename}`
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
    const Acl = new SberCloudObsAcl(obsConfig)

    return async function (req, res, next) {
        if (!req.user) {
            // TODO(zuch): Ask where error pages are located in keystone - 403 is probably missing
            res.sendStatus(403)
            return res.end()
        }
        const meta = await Acl.getMeta(req.params.file)

        if (isEmpty(meta)) {
            res.status(404)
            return next()
        }
        const { id: itemId, ids: stringItemIds, listkey: listKey } = meta

        if ((isEmpty(itemId) && isEmpty(stringItemIds)) || isEmpty(listKey)) {
            res.status(404)
            return next()
        }

        const { id, isAdmin, isSupport, type } = req.user
        const context = await keystone.createContext({ authentication: { item: { id, isAdmin, isSupport, type }, listKey: 'User' } })

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
            hasAccessToReadFile = await getItem({
                keystone,
                listKey,
                itemId,
                context,
                returnFields: 'id',
            })
        }

        if (!hasAccessToReadFile) {
            res.sendStatus(403)
            return res.end()
        }
        const url = Acl.generateUrl(req.params.file)

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
    }
}

class OBSFilesMiddleware {
    prepareMiddleware ({ keystone }) {
        // this route does not have any system change operation and used only for serving files to end user browser
        // this mean no csrf attacking possible - since no data change operation going to be made by opening a link
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use('/api/files/:file(*)', obsRouterHandler({ keystone }))
        return app
    }
}


module.exports = {
    SberCloudFileAdapter,
    OBSFilesMiddleware,
}
