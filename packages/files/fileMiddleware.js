const express = require('express')

const conf = require('@open-condo/config')
const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const {
    RedisGuard,
    authHandler,
    rateLimitHandler,
    parserHandler,
    fileStorageHandler,
    validateAndParseFileConfig,
    fileShareHandler,
    fileAttachHandler,
} = require('./utils')


class FileMiddleware {
    constructor ({
        apiPrefix = '/api/files',
        maxFieldSize = 1024 * 1024, // 1Mb
        maxFileSize = 100 * 1024 * 1024, // 100Mb
        maxFiles = 2,
    } = {}) {
        this.apiPrefix = apiPrefix
        this.processRequestOptions = { maxFieldSize, maxFileSize, maxFiles }
        const { clients, quota } = this.loadConfig()
        this.quota = quota
        this.appClients = clients
    }

    loadConfig () {
        const config = conf['FILE_UPLOAD_CONFIG']
        if (!config) {
            console.warn('File upload config not set, disabling v2 upload')
            return {}
        }
        let parsedConfig
        if (typeof config === 'string') {
            try {
                parsedConfig = JSON.parse(config)
            } catch {
                throw new Error('Unable to parse required FILE_UPLOAD_CONFIG json from environment')
            }
        } else if (config && typeof config === 'object') {
            parsedConfig = config
        } else {
            throw new Error('Unable to parse required FILE_UPLOAD_CONFIG json from environment')
        }

        return validateAndParseFileConfig(parsedConfig)
    }

    prepareMiddleware ({ keystone }) {
        if (!this.appClients) {
            return null
        }
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use(express.json())

        const guard = new RedisGuard()
        const quota = this.quota
        const appClients = this.appClients
        const processRequestOptions = this.processRequestOptions

        // upload route
        app.post(
            this.apiPrefix + '/upload',
            authHandler(),
            rateLimitHandler({ keystone, quota, guard }),
            parserHandler({ processRequestOptions }),
            fileStorageHandler({ keystone, appClients }),
        )

        // share route
        app.post(
            this.apiPrefix + '/share',
            authHandler(),
            rateLimitHandler({ keystone, quota, guard }),
            fileShareHandler({ keystone, appClients })
        )

        // attach route
        app.post(
            this.apiPrefix + '/attach',
            authHandler(),
            fileAttachHandler({ keystone, appClients })
        )

        // catch gql errors, that thrown from main handler
        app.use(expressErrorHandler)

        return app
    }
}

module.exports = { FileMiddleware }
