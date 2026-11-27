const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')

const { applyRateLimitDefaults } = require('./config.utils')
const { resolveAllowedQuota, resolveQuotaIdentity } = require('./request.utils')

const logger = getLogger()

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

function readRateLimitConfig () {
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

    const quotaOptions = applyRateLimitDefaults(readRateLimitConfig())
    const isAuthed = Boolean(userId)
    const { identityPrefix, identifier, key } = resolveQuotaIdentity({ isAuthed, userId, ip })
    const limit = resolveAllowedQuota({
        isAuthed,
        identifier,
        authedQuota: quotaOptions.authedQuota,
        nonAuthedQuota: quotaOptions.nonAuthedQuota,
        customQuotas: quotaOptions.customQuotas,
    })
    const window = quotaOptions.window

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
            identity: identityPrefix,
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
            data: { key, identity: identityPrefix },
        })
        return {
            enabled: true,
            identity: identityPrefix,
            limit,
            used: 0,
            remaining: limit,
            reset: null,
            window,
            error: 'unavailable',
        }
    }
}

module.exports = {
    getComplexityRateLimits,
}
