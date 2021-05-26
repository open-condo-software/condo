const { isEmpty, get } = require('lodash')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { SberCloudFileAdapter } = require('./sberCloudFileAdapter')
const { S3Adapter } = require('@keystonejs/file-adapters')
const coreConfig = require('@core/config')

const { DEFAULT_FILE_ADAPTER } = require('../constants/uploads')

class FileAdapter {

    constructor (folder, type = DEFAULT_FILE_ADAPTER) {
        this.folder = folder
        this.type = type
        let Adapter = null
        switch (type) {
            case 'local':
                Adapter = this.createLocalFileApapter()
                break
            case 'sbercloud':
                Adapter = this.createSbercloudFileApapter()
                break
            case 'aws': 
                Adapter = this.createAWSFileApapter()
                break                
            case 'minio': 
                Adapter = this.createMinioFileApapter()
                break                
            case 'digitalocean': 
                Adapter = this.createDigitalOceanFileApapter()
                break                
            default:
                console.error(`FileAdapter ${type} not configured yet`)
        }
        if (!Adapter && this.type !== 'local') {
            Adapter = this.createLocalFileApapter()
        }
        if (!Adapter) {
            throw new Error('File adapter is not configured')
        }
        return Adapter
    }

    createLocalFileApapter () {
        if (!this.isConfigValid(coreConfig, [ 'MEDIA_ROOT', 'MEDIA_URL' ])) {
            return null
        }
        return new LocalFileAdapter({
            src: `${coreConfig.MEDIA_ROOT}/${this.folder}`,
            path: `${coreConfig.MEDIA_URL}/${this.folder}`,
        })
    }

    getEnvConfig (name, required) {
        const config = process.env[name] ? JSON.parse(process.env[name]) : {}
        if (!this.isConfigValid(config, required)) {
            return null
        }
        return config
    }

    isConfigValid (config, required = []) {
        const missedFields = required.filter(field => !get(config, field))
        if (!isEmpty(missedFields)) {
            console.error(`FileAdapter ${this.type} has missing fields in config file: ${[missedFields.join(', ')]}`)
            return false
        }
        return true
    }

    createSbercloudFileApapter () {
        const config = this.getEnvConfig('SBERCLOUD_OBS_CONFIG',  [
            'bucket',
            's3Options.server',
            's3Options.access_key_id',
            's3Options.secret_access_key',
        ])
        if (!config) {
            return null
        }
        return new SberCloudFileAdapter({ ...config, folder: this.folder })
    }

    createAWSFileApapter () {
        const config = this.getEnvConfig('AWS_OBS_CONFIG', [
            'bucket',
            's3Options.accessKeyId',
            's3Options.secretAccessKey',
            's3Options.region',
        ])
        if (!config) {
            return null
        }
        return new S3Adapter({ ...config, folder: this.folder })
    }
    
    createMinioFileApapter () {
        const config = this.getEnvConfig('MINIO_OBS_CONFIG', [
            'bucket',
            's3Options.accessKeyId',
            's3Options.secretAccessKey',
            's3Options.endpoint',
            's3Options.s3ForcePathStyle',
            's3Options.signatureVersion',
        ])
        if (!config) {
            return null
        }
        return new S3Adapter({ ...config, folder: this.folder })        
    }

    createDigitalOceanFileApapter () {
        const config = this.getEnvConfig('DIGITALOCEAN_OBS_CONFIG', [
            'bucket',
            's3Options.accessKeyId',
            's3Options.secretAccessKey',
            's3Options.endpoint',
        ])
        if (!config) {
            return null
        }
        return new S3Adapter({ ...config, folder: this.folder })        
    }

}


module.exports = FileAdapter
