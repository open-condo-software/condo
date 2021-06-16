const { isEmpty, get } = require('lodash')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { SberCloudFileAdapter } = require('./sberCloudFileAdapter')
const coreConfig = require('@core/config')

const { DEFAULT_FILE_ADAPTER } = require('../constants/uploads')

class NoFileAdapter {

    get error () {
        return new Error('[error] NoFileAdapter configured. Add env record for s3 storage')
    }

    save () {
        return Promise.reject(this.error) 
    }

    getFilename () {
        throw this.error
    }

    publicUrl () {
        throw this.error
    }

}

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
                if (!Adapter) {
                    // No fallback to local file adapter
                    Adapter = new NoFileAdapter()
                }
                break
        }
        if (!Adapter) {
            console.error('File adapter is not configured')
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
        const config = coreConfig[name] ? JSON.parse(coreConfig[name]) : {}
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

}


module.exports = FileAdapter
