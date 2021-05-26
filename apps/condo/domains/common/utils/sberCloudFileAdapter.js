const ObsClient = require('esdk-obs-nodejs')
class SberCloudFileAdapter {

    constructor (config) {
        this.bucket = config.bucket
        this.s3 = new ObsClient(config.s3Options)
        this.server = config.s3Options.server
        this.folder = config.folder
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

    publicUrl ({ filename }) {
        return `https://${this.bucket}.${this.server}/${this.folder}/${filename}`
    }

    uploadParams ({ id }) {
        return { 
            Metadata: { 
                keystone_id: `${id}`,
            },
        }
    }
}

module.exports = {
    SberCloudFileAdapter,
}
