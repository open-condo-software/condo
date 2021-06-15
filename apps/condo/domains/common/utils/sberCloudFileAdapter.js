const ObsClient = require('esdk-obs-nodejs')
const path = require('path')
const { SERVER_URL, SBERCLOUD_OBS_CONFIG } = require('@core/config')
const { getItem } = require('@keystonejs/server-side-graphql-client')
const { isEmpty } = require('lodash')

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
    // createSignedUrlSync is executed without request to obs, so there is no need to cache result
    generateUrl (filename, ttl = 300) { // obs default
        const { SignedUrl } = this.s3.createSignedUrlSync({
            Method: 'GET',
            Bucket : this.bucket, 
            Key : filename,
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
        this.acl = new SberCloudObsAcl(config)
    }

    save ({ stream, filename, id, mimetype, encoding }) {
        return new Promise((resolve, reject) => {
            const fileData = {
                id,
                originalFilename: filename,
                filename: this.getFilename({ id, originalFilename: filename }),
                mimetype,
                encoding,
            }
            const uploadParams = this.uploadParams(fileData)
            this.s3.putObject(
                {
                    Body: stream,
                    ContentType: mimetype,
                    Bucket: this.bucket,
                    Key: `${this.folder}/${fileData.filename}`,
                    ...uploadParams,
                },
                (error, data) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve({ ...fileData, _meta: data })
                    }
                    stream.destroy()
                }
            )
        })
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
        return `${id}${path.extname(originalFilename)}` // will skip adding originalFilename 
    }

    publicUrl ({ filename }) {
        // It is possible to sign public URL here and to return the signed URL with access token without using middleware.
        // We are using middleware on the following reasons
        // 1. we want file urls to point to our server
        // 2. if we give access token to file here - then the user can face such scenario:
        //    user opens ticket page
        //    then after 5 minutes, he decides to download the file and click on the URL
        //    the token is expired - user needs to reload the page to generate a new access token
        return `${SERVER_URL}/api/files/${this.folder}/${filename}`
    }

    uploadParams () {
        return { 
            Metadata: {},
        }
    }
}

const obsRouterHandler = ({ keystone }) => {

    const obsConfig = SBERCLOUD_OBS_CONFIG ? JSON.parse(SBERCLOUD_OBS_CONFIG) : {}
    const Acl = new SberCloudObsAcl(obsConfig)

    return async function (req, res, next) {
        if (!req.user) {
            // TODO(zuch): Ask where  error pages are located in keystone - 403 is probably missing
            res.sendStatus(403)
            return res.end()
        }
        const meta = await Acl.getMeta(req.params.file)
        if (isEmpty(meta)) {
            res.status(404)
            return next()
        }
        const { id: itemId, listkey: listKey } = meta
        if (isEmpty(itemId) || isEmpty(listKey)) {
            res.status(404)
            return next()
        }
        const { id: userId } = req.user
        const context = await keystone.createContext({ authentication: { item: { id: userId }, listKey: 'User' } })
        const fileAfterAccessCheck = await getItem({
            keystone,
            listKey,
            itemId,
            context,
        })
        if (!fileAfterAccessCheck) {
            res.sendStatus(403)
            return res.end()
        }
        const url = Acl.generateUrl(req.params.file)
        return res.redirect(url)        
    }
}


module.exports = {
    SberCloudFileAdapter,
    obsRouterHandler,
}
