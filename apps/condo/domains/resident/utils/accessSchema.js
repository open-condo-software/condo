const { get, set, pick } = require('lodash')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { find } = require('@open-condo/keystone/schema')

const _redisClient = getKVClient('default', 'cache')
const DEFAULT_CACHE_TTL_IN_MS = 60 * 60 * 1000 // 1 hour
const CACHE_TTL_FROM_ENV = parseInt(conf['USER_RESIDENT_CACHING_TTL_IN_MS'])
const CACHE_TTL_IN_MS = isNaN(CACHE_TTL_FROM_ENV) ? DEFAULT_CACHE_TTL_IN_MS : CACHE_TTL_FROM_ENV
const DISABLE_USER_RESIDENT_CACHING = get(conf, 'DISABLE_USER_RESIDENT_CACHING', 'false').toLowerCase() === 'true'
const RESIDENT_CACHE_FIELDS = ['id', 'unitName', 'unitType', 'addressKey', 'organization', 'property']
const SERVICE_CONSUMER_CACHE_FIELDS = ['id', 'organization', 'accountNumber', 'resident']

const _getUserResidentCacheKey = (user) => `cache:residents:user:${user.id}`
const resetUserResidentCache = async (userId) => await _redisClient.del(_getUserResidentCacheKey({ id: userId }))

/**
 * Info about user resident
 * @typedef {Object} ResidentCache
 * @property {string} id - resident id
 * @property {string} unitName - resident unitName
 * @property {string} unitType - resident type of the unit
 * @property {string} organization - resident organization id
 * @property {string} property - resident property id
 * @property {string} addressKey - addressKey of the resident property
 */

/**
 * Info about user service consumers
 * @typedef {Object} ServiceConsumerCache
 * @property {string} id - id of the resident service consumer
 * @property {string} organization - organization id of service consumer
 * @property {string} accountNumber - account number of service consumer
 * @property {string} resident - current service consumer resident
 */

/**
 * Info about all resident records of the current user
 * @typedef {Object} UserResidentCache
 * @property {number} dv - cache entry data version
 * @property {Array<ResidentCache>} residents - resident of the current user
 * @property {Array<ServiceConsumerCache>} serviceConsumers - resident service consumers
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
    const residents = await find('Resident', { user: { id: user.id }, deletedAt: null })
    const serviceConsumers = await find('ServiceConsumer', { deletedAt: null, resident: { id_in: residents.map(resident => resident.id) } })

    newCacheEntry.residents = residents.map(resident => pick(resident, RESIDENT_CACHE_FIELDS))
    newCacheEntry.serviceConsumers = serviceConsumers.map(serviceConsumer => pick(serviceConsumer, SERVICE_CONSUMER_CACHE_FIELDS))

    if (!DISABLE_USER_RESIDENT_CACHING) {
        set(ctx, ctxCachePath, newCacheEntry)
        await _redisClient.set(cacheKey, JSON.stringify(newCacheEntry), 'PX', CACHE_TTL_IN_MS)
    }

    return newCacheEntry
}

/**
 * Obtains user resident info via caching or sub-querying
 * @param {{ req: import('express').Request }} ctx - keystone context
 * @param {{ id: string }} user - user object
 * @returns {Promise<Array<ResidentCache>>}
 */
async function getUserResidents (ctx, user) {
    return (await _getUserResidents(ctx, user)).residents
}

/**
 * Obtains info about resident service consumers via caching or sub-querying
 * @param ctx
 * @param user
 * @returns {Promise<Array<ServiceConsumerCache>>}
 */
async function getUserServiceConsumers (ctx, user) {
    return (await _getUserResidents(ctx, user)).serviceConsumers
}

module.exports = {
    resetUserResidentCache,
    getUserResidents,
    getUserServiceConsumers,
}
