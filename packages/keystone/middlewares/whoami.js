const express = require('express')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getComplexityRateLimits } = require('@open-condo/keystone/apolloServerPlugins/rateLimiting/quota.utils')

const SECRET_HEADERS = new Set([
    'cookie',
    'authorization',
    'proxy-authorization',
    'x-proxy-signature',
    'set-cookie',
])

const X_TARGET_OPTIONS_VAR_NAME = 'X_TARGET_OPTIONS'

function getHeaderValue (headers, name) {
    const value = headers[name]
    if (Array.isArray(value)) {
        return value.find(Boolean) || null
    }
    if (typeof value === 'string' && value.length > 0) {
        return value
    }
    return null
}

function sanitizeHeaders (headers) {
    const result = {}
    for (const [name, value] of Object.entries(headers || {})) {
        if (SECRET_HEADERS.has(name.toLowerCase())) {
            continue
        }
        result[name] = value
    }
    return result
}

function getRequestTarget (headers) {
    const allowedTargets = (conf[X_TARGET_OPTIONS_VAR_NAME] || '').split(',').filter(Boolean)
    const xTargetHeader = getHeaderValue(headers, 'x-target')
    if (!xTargetHeader) {
        return null
    }
    return allowedTargets.includes(xTargetHeader) ? xTargetHeader : null
}

class WhoAmIMiddleware {
    endpoint = '/api/whoami'

    constructor ({ endpoint } = {}) {
        if (endpoint) {
            this.endpoint = endpoint
        }
    }

    async prepareMiddleware () {
        // NOTE: Publicly available middleware
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.get(this.endpoint, async function (req, res) {
            const userId = get(req, 'user.id', null)
            const headers = sanitizeHeaders(req.headers)
            const complexity = await getComplexityRateLimits({ userId, ip: req.ip })

            const data = {
                ip: req.ip,
                userId,
                headers,
                rateLimits: {
                    complexity,
                },
                requestId: req.id || null,
                startRequestId: req.startId || null,
                target: getRequestTarget(req.headers),
                time: new Date().toISOString(),
                build: conf.WERF_COMMIT_HASH || 'local',
                host: req.hostname || null,
                protocol: req.protocol || null,
                originalIp: req.originalIp || null,
            }

            res.json(data)
        })

        return app
    }
}

module.exports = {
    WhoAmIMiddleware,
}
