const { isEmpty, get } = require('lodash')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { SberCloudFileAdapter } = require('./sberCloudFileAdapter')
const coreConfig = require('@core/config')

class FileAdapter {

    constructor (folder, type = 'sbercloud') {
        this.folder = folder
        this.type = type
        // keystone supports Cloudinary, DigitalOcean Spaces, Minio, AWS S3
        switch (type) {
            case 'sbercloud':
                return this.createSbercloudFileApapter()
            case 'local':
                return this.createLocalFileApapter()
            default:
                throw new Error(`FileAdapter ${type} not configured yet`)
        }
    }

    checkConfig (config, required = []) {
        const missedFields = required.filter(field => !get(config, field))
        if (!isEmpty(missedFields)) {
            throw new Error(`FileAdapter ${this.type} has missing fields in config file: ${[missedFields.join(', ')]}`)
        }
    }

    createSbercloudFileApapter () {
        const config = process.env.SBERCLOUD_OBS_CONFIG ? JSON.parse(process.env.SBERCLOUD_OBS_CONFIG) : {}
        this.checkConfig(config, [
            'bucket',
            's3Options.server',
            's3Options.access_key_id',
            's3Options.secret_access_key',
        ])
        return new SberCloudFileAdapter({ ...config, folder: this.folder })
    }

    createLocalFileApapter () {
        this.checkConfig(coreConfig, [
            'MEDIA_ROOT',
            'MEDIA_URL',
        ])
        return new LocalFileAdapter({
            src: `${coreConfig.MEDIA_ROOT}/${this.folder}`,
            path: `${coreConfig.MEDIA_URL}/${this.folder}`,
        })
    }

}


module.exports = FileAdapter
