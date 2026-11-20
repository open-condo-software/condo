const express = require('express')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const {
    DEFAULT_AUTHED_QUOTA,
    DEFAULT_NON_AUTHED_QUOTA,
    DEFAULT_QUOTA_WINDOW,
} = require('@open-condo/keystone/apolloServerPlugins/rateLimiting/constants')
const { buildQuotaKey } = require('@open-condo/keystone/apolloServerPlugins/rateLimiting/request.utils')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger()

const SECRET_HEADERS = new Set([
    'cookie',
    'authorization',
    'proxy-authorization',
    'x-proxy-signature',
    'set-cookie',
])

const GEO_COUNTRY_HEADERS = [
    'cf-ipcountry',
    'cloudfront-viewer-country',
    'x-country-code',
    'x-geo-country',
]
const GEO_REGION_HEADERS = [
    'cf-region-code',
    'cf-region',
    'cloudfront-viewer-country-region',
    'x-geo-region',
]
const GEO_CITY_HEADERS = [
    'cf-ipcity',
    'cloudfront-viewer-city',
    'x-geo-city',
]

const X_TARGET_OPTIONS_VAR_NAME = 'X_TARGET_OPTIONS'
const WHOAMI_KV_CLIENT_NAME = 'whoami'
const WHOAMI_REDIS_READ_TIMEOUT_MS = 500

function withTimeout (promise, timeoutMs, message) {
    let timeoutId
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(message))
            }, timeoutMs)
        }),
    ]).finally(() => {
        clearTimeout(timeoutId)
    })
}

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

function getFirstHeaderValue (headers, names) {
    for (const name of names) {
        const value = getHeaderValue(headers, name)
        if (value) {
            return value
        }
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

function getGeolocation (headers) {
    return {
        country: getFirstHeaderValue(headers, GEO_COUNTRY_HEADERS),
        region: getFirstHeaderValue(headers, GEO_REGION_HEADERS),
        city: getFirstHeaderValue(headers, GEO_CITY_HEADERS),
    }
}

function getRequestTarget (headers) {
    const allowedTargets = (conf[X_TARGET_OPTIONS_VAR_NAME] || '').split(',').filter(Boolean)
    const xTargetHeader = getHeaderValue(headers, 'x-target')
    if (!xTargetHeader) {
        return null
    }
    return allowedTargets.includes(xTargetHeader) ? xTargetHeader : null
}

function getRateLimitConfig () {
    try {
        return JSON.parse(conf['RATE_LIMIT_CONFIG'] || '{}')
    } catch (err) {
        logger.error({ msg: 'failed to parse RATE_LIMIT_CONFIG', err })
        return {}
    }
}

async function getComplexityRateLimits ({ userId, ip }) {
    if (conf['DISABLE_RATE_LIMIT'] === 'true') {
        return { enabled: false }
    }

    const rateLimitConfig = getRateLimitConfig()
    const isAuthed = Boolean(userId)
    const identity = isAuthed ? 'user' : 'ip'
    const identifier = isAuthed ? userId : ip
    const key = buildQuotaKey(identity, identifier)

    const customQuotas = rateLimitConfig.customQuotas || {}
    let limit = isAuthed
        ? (rateLimitConfig.authedQuota || DEFAULT_AUTHED_QUOTA)
        : (rateLimitConfig.nonAuthedQuota || DEFAULT_NON_AUTHED_QUOTA)

    if (Object.prototype.hasOwnProperty.call(customQuotas, identifier)) {
        limit = customQuotas[identifier]
    }

    const window = rateLimitConfig.window || DEFAULT_QUOTA_WINDOW

    try {
        const redisClient = getKVClient(WHOAMI_KV_CLIENT_NAME)
        const [usedRaw, ttlValueInSec] = await withTimeout(
            Promise.all([
                redisClient.get(key),
                redisClient.ttl(key),
            ]),
            WHOAMI_REDIS_READ_TIMEOUT_MS,
            `whoami redis read timed out after ${WHOAMI_REDIS_READ_TIMEOUT_MS}ms`,
        )

        const used = Math.max(0, Number.parseInt(usedRaw, 10) || 0)
        const remaining = Math.max(limit - used, 0)
        let reset = null
        if (typeof ttlValueInSec === 'number' && ttlValueInSec > 0) {
            reset = Math.ceil((Date.now() + ttlValueInSec * 1000) / 1000)
        }

        return {
            enabled: true,
            identity,
            limit,
            used,
            remaining,
            reset,
            window,
        }
    } catch (err) {
        logger.error({
            msg: 'failed to read complexity rate limit',
            err,
            data: { key, identity },
        })
        return {
            enabled: true,
            identity,
            limit,
            used: 0,
            remaining: limit,
            reset: null,
            window,
            error: 'unavailable',
        }
    }
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
                geolocation: getGeolocation(req.headers),
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
