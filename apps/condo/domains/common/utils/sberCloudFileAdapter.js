const ObsClient = require('esdk-obs-nodejs')
const path = require('path')
const { SERVER_URL } = require('@core/config')
const { runCustomQuery } = require('@keystonejs/server-side-graphql-client')
const has = require('lodash/has')
const { gql } = require('graphql-tag')

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
        return `${id}${path.extname(originalFilename)}` // will skip adding originalFilename 
    }

    publicUrl ({ filename }) {
        // https://${this.bucket}.${this.server}
        return `${SERVER_URL}/api/files/${this.folder}/${filename}`
    }

    uploadParams ({ id }) {
        return { 
            Metadata: { 
                keystone_id: `${id}`,
            },
        }
    }
}

const obsRouterHandler = (keystone) => async function (req, res, next) {
    const file = req.params.file
    // TODO(zuch) - move this to file meta or make constants
    const translate = {
        'ticket': 'TicketFiles',
    }
    if (!req.user) {
        return res.status(403).render()
    }
    const [ folder, name, _ ] = file.split(/[/.]/g)
    if (!has(translate, folder)) {
        return res.end('public file')
    }
    const { id: userId } = req.user
    const context = await keystone.createContext({ authentication: { item: { id: userId }, listKey: 'User' } })
    
    console.log(context.gqlNames('TicketFile'))

    const { itemQueryName, listQueryName } = context.gqlNames('TicketFile')

    try {
        const query = gql`query ($file: String!) { ${listQueryName}(where: { file: $file }) { id organization }  }`
        const result = await runCustomQuery({ keystone, query, variables: { file: file }, context })
        console.log('result 1 ', result)
    } catch (error) {
        console.log('1 ', error)
    }

    
    res.end(file)
}


module.exports = {
    SberCloudFileAdapter,
    obsRouterHandler,
}
