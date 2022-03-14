const { isEmpty, get } = require('lodash')

const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { StaticApp } = require('@keystonejs/app-static')
const conf = require('@core/config')

const { SberCloudFileAdapter, OBSFilesMiddleware } = require('./sberCloudFileAdapter')
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

    constructor (folder) {
        const type = conf.FILE_FIELD_ADAPTER || DEFAULT_FILE_ADAPTER
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
        }
        if (!Adapter) {
            // No fallback to local file adapter
            if (conf.NODE_ENV === 'production') {
                throw new Error('File adapter is not configured. You need to check FILE_FIELD_ADAPTER and their configs')
            } else {
                // TODO(pahaz): DOMA-1569 remove this backward compatibility and throw an error
                Adapter = new NoFileAdapter()
                console.error('File adapter is not configured')
            }
        }
        return Adapter
    }

    createLocalFileApapter () {
        if (!this.isConfigValid(conf, [ 'MEDIA_ROOT', 'MEDIA_URL', 'SERVER_URL' ])) {
            return null
        }
        return new LocalFileAdapter({
            src: `${conf.MEDIA_ROOT}/${this.folder}`,
            path: `${conf.SERVER_URL}${conf.MEDIA_URL}/${this.folder}`,
        })
    }

    getEnvConfig (name, required) {
        const config = conf[name] ? JSON.parse(conf[name]) : {}
        if (!this.isConfigValid(config, required)) {
            return null
        }
        return config
    }

    isConfigValid (config, required = []) {
        const missedFields = required.filter(field => !get(config, field))
        if (!isEmpty(missedFields)) {
            console.error(`FileAdapter type=${this.type} has missing fields in config variable: ${[missedFields.join(', ')]}`)
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

    // TODO(pahaz): DOMA-1569 it's better to create just a function. But we already use FileAdapter in many places. I just want to save a backward compatibility
    static makeFileAdapterMiddleware () {
        const type = conf.FILE_FIELD_ADAPTER || DEFAULT_FILE_ADAPTER
        if (type === 'local') {
            return new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT })
        } else if (type === 'sbercloud') {
            return new OBSFilesMiddleware()
        } else {
            throw new Error('Unknown file field adapter. You need to check FILE_FIELD_ADAPTER')
        }
    }
}


module.exports = FileAdapter
