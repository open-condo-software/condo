const ObsClient = require('esdk-obs-nodejs')
const { createReadStream } = require('fs')

class SberCloudFileAdapter {

    constructor (folder = '') {
        const sberCloudObsConfig = process.env.SBERCLOUD_OBS_CONFIG ? JSON.parse(process.env.SBERCLOUD_OBS_CONFIG) : {}
        this.bucket = sberCloudObsConfig.bucket
        if (!this.bucket) {
            throw new Error('SberCloudAdapter: S3Adapter requires a bucket name.')
        }
        this.s3 = new ObsClient(sberCloudObsConfig.s3Options)
        this.folder = folder
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
        return `${id}-${originalFilename}`
    }

    publicUrl (filename) {
        return `https://${this.bucket}.${this.s3Options.server}/${this.folder}/${filename}`
    }

    uploadParams ({ id }) {
        return { 
            Metadata: { 
                keystone_id: `${id}`,
            },
        }
    }
}



class SberCloudObs {

    constructor (config) {
        const sberCloudObsConfig = process.env.SBERCLOUD_OBS_CONFIG ? JSON.parse(process.env.SBERCLOUD_OBS_CONFIG) : {}
        this.bucket = config.bucket || sberCloudObsConfig.bucket
        if (!this.bucket) {
            throw new Error('SberCloudAdapter: S3Adapter requires a bucket name.')
        }
        this.obs = new ObsClient(sberCloudObsConfig.s3Options)
        this.folder = config.folder     
    }

    async isBucketExists () {
        const { CommonMsg: { Status } } = await this.obs.headBucket({ Bucket: this.bucket })
        return Status < 300
    }

    async createBucket (params = {}) {
        const { CommonMsg: { Status } } = await this.obs.CreateBucket({
            Bucket: this.bucket,
            ACL: this.obs.enums.AclPrivate,
            StorageClass: this.obs.enums.StorageClassStandard,
            ...params,
        })
        return Status < 300
    }

    async deleteBucket () {
        const { CommonMsg: { Status } } = await this.obs.deleteBucket({
            Bucket: this.bucket,
        })
        return Status < 300
    }

    async listObjects () {
        const { InterfaceResult: { Contents } } = await this.obs.listObjects({ Bucket: this.bucket })
        return Contents
    }

    async saveToLocalPath (name, location) {
        await this.obs.downloadFile({
            Bucket: this.bucket,
            Key: name,
            DownloadFile: location,
        })
    }

    async uploadObject (name, location) {
        await this.obs.putObject({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
            Body: createReadStream(location),
        })
    }

    async deleteObject (name) {
        await this.obs.deleteObject({
            Bucket: this.bucket,
            Key: `${this.folder}/${name}`,
        })
    }
}

module.exports = {
    SberCloudFileAdapter,
    SberCloudObs,
}