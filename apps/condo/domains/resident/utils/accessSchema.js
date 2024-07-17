const { get, set } = require('lodash')

const conf = require('@open-condo/config')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { find } = require('@open-condo/keystone/schema')

const _redisClient = getRedisClient('default', 'cache')
const DEFAULT_CACHE_TTL_IN_MS = 60 * 60 * 1000 // 1 hour
const CACHE_TTL_FROM_ENV = parseInt(conf['USER_RESIDENT_CACHING_TTL_IN_MS'])
const CACHE_TTL_IN_MS = isNaN(CACHE_TTL_FROM_ENV) ? DEFAULT_CACHE_TTL_IN_MS : CACHE_TTL_FROM_ENV
const DISABLE_USER_RESIDENT_CACHING = get(conf, 'DISABLE_USER_RESIDENT_CACHING', 'false').toLowerCase() === 'true'

const _getUserResidentCacheKey = (user) => `cache:residents:user:${user.id}`
const resetUserResidentCache = async (userId) => await _redisClient.del(_getUserResidentCacheKey({ id: userId }))

/**
 * Info about all resident records of the current user
 * @typedef {Object} UserResidentCache
 * @property {number} dv - cache entry data version
 * @property {Array<Object>} residents - resident of the current user
 */

/**
 * Trying to receive residents of the specified user from cache or db querying
 * @param {{ req: import('express').Request }} ctx
 * @param {{ id: string }} user - user object
 * @returns {Promise<UserResidentCache>}
 * @private
 */
async function _getUserResidents (ctx, user) {
    const cacheKey = _getUserResidentCacheKey(user)
    const ctxCachePath = ['req', 'context', 'cache', cacheKey]

    if (!DISABLE_USER_RESIDENT_CACHING) {
        const existingRequestCache = get(ctx, ctxCachePath)
        if (existingRequestCache) return existingRequestCache

        const cachedDataString = await _redisClient.get(cacheKey)
        if (cachedDataString !== null) {
            const cachedResidents = JSON.parse(cachedDataString)
            set(ctx, ctxCachePath, cachedResidents)
            return cachedResidents
        }
    }

    const newCacheEntry = { dv: 1, residents: [], serviceConsumers: [] }
    newCacheEntry.residents = await find('Resident', { user: { id: user.id }, deletedAt: null })
    newCacheEntry.serviceConsumers = await find('ServiceConsumer', {
        deletedAt: null, resident: { id_in: newCacheEntry.residents.map(resident => resident.id) },
    })

    if (!DISABLE_USER_RESIDENT_CACHING) {
        set(ctx, ctxCachePath, newCacheEntry)
        await _redisClient.set(cacheKey, JSON.stringify(newCacheEntry), 'PX', CACHE_TTL_IN_MS)
    }

    return newCacheEntry
}

async function getUserResidents (ctx, user) {
    return (await _getUserResidents(ctx, user)).residents || []
}

async function getUserServiceConsumers (ctx, user) {
    return (await _getUserResidents(ctx, user)).serviceConsumers || []
}

module.exports = {
    resetUserResidentCache,
    getUserResidents,
    getUserServiceConsumers,
}
