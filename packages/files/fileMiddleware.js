const express = require('express')

const conf = require('@open-condo/config')

const {
    RedisGuard,
    authHandler,
    rateLimitHandler,
    parserHandler,
    fileStorageHandler,
    attachHandler,
    validateAndParseAppClients,
} = require('./utils')

const DEFAULT_USER_QUOTA = 100
const DEFAULT_IP_QUOTA = 100


class FileMiddleware {
    constructor ({
        apiUrl = '/api/files',
        maxFieldSize = 200 * 1024 * 1024,
        maxFileSize = 200 * 1024 * 1024,
        maxFiles = 2,
    } = {}) {
        this.apiUrl = apiUrl
        this.processRequestOptions = { maxFieldSize, maxFileSize, maxFiles }

        this.quota = this.loadQuota()
        this.appClients = this.loadAppClients()
    }

    loadQuota () {
        let quota
        try {
            const raw = conf['FILE_QUOTA']
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
            if (parsed && parsed.user > 0 && parsed.ip > 0) quota = parsed
        } catch (_) {
            // fall back to defaults
        }
        return quota || { user: DEFAULT_USER_QUOTA, ip: DEFAULT_IP_QUOTA }
    }

    loadAppClients () {
        const raw = conf['FILE_APP_CLIENTS']
        if (!raw) {
            console.warn('File - app access control disabled')
            return undefined
        }

        // Accept string or already-parsed object
        let parsed
        if (typeof raw === 'string') {
            try {
                parsed = JSON.parse(raw)
            } catch {
                throw new Error('Unable to parse required FILE_APP_CLIENTS json from environment')
            }
        } else if (raw && typeof raw === 'object') {
            parsed = raw
        } else {
            throw new Error('Unable to parse required FILE_APP_CLIENTS json from environment')
        }

        try {
            return validateAndParseAppClients(parsed)
        } catch (e) {
            const isZod = e && (e.issues || e.name === 'ZodError')
            if (isZod) throw new Error(JSON.stringify(e.issues || e.errors || e))
            throw e
        }
    }

    /**
   * Prepare and return an express app with routes mounted. No external routes exposed.
   */
    prepareMiddleware ({ keystone }) {
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        const guard = new RedisGuard()
        const quota = this.quota
        const appClients = this.appClients
        const processRequestOptions = this.processRequestOptions

        // upload route
        app.post(
            this.apiUrl + '/upload',
            authHandler(),
            rateLimitHandler({ keystone, quota, guard }),
            parserHandler({ processRequestOptions }),
            fileStorageHandler({ keystone, appClients }),
        )

        // attach route
        app.post(
            this.apiUrl + '/attach',
            authHandler(),
            attachHandler({ keystone })
        )

        return app
    }
}

module.exports = { FileMiddleware }
