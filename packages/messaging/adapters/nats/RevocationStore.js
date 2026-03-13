const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger()

const REVOKED_USERS_KEY = 'messaging:revokedUsers'
const REVOKED_USER_ORGS_KEY = 'messaging:revokedUserOrgs'

let redis = null
let redisAvailable = null

function getRedis () {
    if (redisAvailable === false) return null
    if (redisAvailable === true) return redis

    try {
        const { getKVClient } = require('@open-condo/keystone/kv')
        redis = getKVClient('messaging')
        if (!redis) {
            redisAvailable = false
            return null
        }
        redisAvailable = true
        return redis
    } catch (err) {
        logger.warn({ msg: 'Redis not available for messaging revocation persistence, using in-memory only', err: err.message })
        redisAvailable = false
        return null
    }
}

async function loadRevokedUsers () {
    const client = getRedis()
    if (!client) {
        throw new Error(`Redis client not available for loading ${REVOKED_USERS_KEY}`)
    }
    try {
        const members = await client.smembers(REVOKED_USERS_KEY)
        return new Set(members)
    } catch (err) {
        logger.error({ msg: `Failed to load ${REVOKED_USERS_KEY} from Redis`, err })
        throw err
    }
}

async function loadRevokedUserOrgs () {
    const client = getRedis()
    if (!client) {
        throw new Error(`Redis client not available for loading ${REVOKED_USER_ORGS_KEY}`)
    }
    try {
        const entries = await client.hgetall(REVOKED_USER_ORGS_KEY)
        const map = new Map()
        for (const key of Object.keys(entries)) {
            const sepIdx = key.indexOf(':')
            if (sepIdx === -1) continue
            const userId = key.substring(0, sepIdx)
            const orgId = key.substring(sepIdx + 1)
            if (!map.has(userId)) map.set(userId, new Set())
            map.get(userId).add(orgId)
        }
        return map
    } catch (err) {
        logger.error({ msg: `Failed to load ${REVOKED_USER_ORGS_KEY} from Redis`, err })
        throw err
    }
}

async function addRevokedUser (userId) {
    const client = getRedis()
    if (!client) return
    try {
        await client.sadd(REVOKED_USERS_KEY, userId)
    } catch (err) {
        logger.error({ msg: 'Failed to persist user revocation to Redis', err, data: { userId } })
        throw err
    }
}

async function removeRevokedUser (userId) {
    const client = getRedis()
    if (!client) return
    try {
        await client.srem(REVOKED_USERS_KEY, userId)
    } catch (err) {
        logger.error({ msg: 'Failed to remove user revocation from Redis', err, data: { userId } })
        throw err
    }
}

async function addRevokedUserOrg (userId, organizationId) {
    const client = getRedis()
    if (!client) return
    try {
        await client.hset(REVOKED_USER_ORGS_KEY, `${userId}:${organizationId}`, '1')
    } catch (err) {
        logger.error({ msg: 'Failed to persist user-org revocation to Redis', err, data: { userId, organizationId } })
        throw err
    }
}

async function removeRevokedUserOrg (userId, organizationId) {
    const client = getRedis()
    if (!client) return
    try {
        await client.hdel(REVOKED_USER_ORGS_KEY, `${userId}:${organizationId}`)
    } catch (err) {
        logger.error({ msg: 'Failed to remove user-org revocation from Redis', err, data: { userId, organizationId } })
        throw err
    }
}

module.exports = {
    loadRevokedUsers,
    loadRevokedUserOrgs,
    addRevokedUser,
    removeRevokedUser,
    addRevokedUserOrg,
    removeRevokedUserOrg,
}
