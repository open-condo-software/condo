/**
 * Keystone database adapter level cache
 *
 * How it works:
 *
 * To understand how adapterCache works we need to understand the environment and the tasks that this feature solve
 * 1. Your web app has multiple instances, but single database
 * 2. You use Redis
 * 3. You need a mechanism to lower the number of SQL queries to your DB
 *
 * Adapter cache has two variables:
 *
 * State -- saved in redis and contains last date of update (update_time) on every GQL List.
 * State part example: { "User": "1669912192723" }
 *
 * Cache -- saved internally in instance.
 * Cache part example: { "User": { "where:{id:"1"},first:1": { result: <User>, updateTime: "1669912192723" } ] } }
 *
 * For every list patch listAdapter function:
 * If request to this list is Query:
 *  1. check if request is in cache
 *  2. check if cache last update time equals state last update time
 *  3. If both checks are passed:
 *      1. return value from cache
 *     Else:
 *     1. get value from DB
 *     2. update cache
 * If request to this list is Mutation (anything that mutates the data):
 *  1. update state on this list to the update time of the updated/created/deleted object
 */

const { get, cloneDeep } = require('lodash')

const { getLogger } = require('./logging')
const { queryHasField } = require('./queryHasField')
const { getRedisClient } = require('./redis')

const UPDATED_AT_FIELD = 'updatedAt'
const STATE_REDIS_KEY_PREFIX = 'adapterCacheState'

const logger = getLogger('🔴 adapterCache')


class AdapterCache {

    constructor (config) {
        try {
            const parsedConfig = JSON.parse(config)

            this.enabled = !!get(parsedConfig, 'enable', false)

            // Cache: listName -> queryKey -> { response, lastUpdate }
            this.cache = {}

            // Redis is used as State:
            // State: listName -> lastUpdate
            this.redisClient = this.getStateRedisClient()

            // This mechanism allows to skip caching some lists.
            // Useful for hotfixes or disabling cache for business critical lists
            //
            // includeAllLists is Bool:
            // If includeAllLists is True:
            // ==> "includedLists" is ignored.
            // ==> all lists, that are not in "excludedLists" are cached.
            // Else:
            // ==> only lists, that are in "includedLists" are cached.
            // ==> lists that are in "excludedLists" are NOT cached.
            this.includeAllLists = !!get(parsedConfig, 'includeAllLists', false)
            this.includedLists = get(parsedConfig, 'includedLists', [])
            this.excludedLists = get(parsedConfig, 'excludedLists', [])

            // Logging allows to get the percentage of cache hits
            this.logging = get(parsedConfig, 'logging', false)
            this.totalRequests = 0
            this.cacheHits = 0

        } catch (e) {
            this.enabled = false
            logger.warn(`ADAPTER_CACHE: Bad config! reason ${e}`)
        }
    }

    /**
     * Sometimes we might get a situation when two instances try to update state with different timestamp values.
     * So, we might have two commands ordered to execute by internal redis queue:
     * 1. SET some_key 1670000000010
     * 2. SET some_key 1670000000009
     * In result (GET some_key) will equal 1670000000009, but the correct value is 1670000000010!
     * So to counter this we write custom redis function that will update value only if it is bigger!
     */
    getStateRedisClient () {
        const updateTimeStampFunction = {
            numberOfKeys: 1,
            lua: `
            local time = tonumber(ARGV[1])
            local old_time = tonumber(redis.call('GET', KEYS[1]))
            if (old_time == nil) then
                return redis.call('SET', KEYS[1], ARGV[1])
            end
            if (time > old_time) then
                return redis.call('SET', KEYS[1], ARGV[1])
            end
        ` }

        const redis = getRedisClient('adapterCacheState')
        redis.defineCommand('cacheUpdateStateTimestamp', updateTimeStampFunction)
        return redis
    }

    /**
     * Sets last updated list time to Redis storage
     * @param {string} listName -- List name
     * @param {Date} value -- Last updated time
     * @returns {Promise<void>}
     */
    async setState (listName, time) {
        const serializedTime = time.valueOf()
        const prefixedKey = `${STATE_REDIS_KEY_PREFIX}:${listName}`
        await this.redisClient.cacheUpdateStateTimestamp(prefixedKey, serializedTime)
    }

    /**
     * Returns last updated time by list from Redis
     * @param {string} listName -- List name
     * @returns {Promise<Date>}
     */
    async getState (listName) {
        const serializedTime = await this.redisClient.get(`${STATE_REDIS_KEY_PREFIX}:${listName}`)
        if (serializedTime) {
            const parsedTime = parseInt(serializedTime)
            if (!isNaN(parsedTime)) { return new Date(parsedTime) }
        }
        return null
    }

    getCacheEvent ({ type, functionName, key, list, result }) {
        return ({
            type: type,
            function: functionName,
            list: list,
            key: key,
            response: result,
            meta: {
                hits: this.cacheHits,
                total: this.totalRequests,
            },
        })
    }

    logEvent ({ event }) {
        if (!this.logging) return
        logger.info(event)
    }

    async prepareMiddleware ({ keystone, dev, distDir }) {
        if (this.enabled) {
            await patchKeystoneAdapterWithCacheMiddleware(keystone, this)
            logger.info('ADAPTER_CACHE: Adapter level cache ENABLED')
        } else {
            logger.info('ADAPTER_CACHE: Adapter level cache NOT ENABLED')
        }
    }
}

/**
 * Patches an internal keystone adapter adding cache functionality
 * @param keystone
 * @param {AdapterCache} middleware
 * @returns {Promise<void>}
 */
async function patchKeystoneAdapterWithCacheMiddleware (keystone, middleware) {
    const keystoneAdapter = keystone.adapter

    const cache = middleware.cache
    const includeAllLists = middleware.includeAllLists
    const excludedLists = middleware.excludedLists
    const includedLists = middleware.includedLists

    const listAdapters = Object.values(keystoneAdapter.listAdapters)

    const manyToManyLists = {}
    const connectedLists = {}

    const relations = {}
    for (const listAdapter of listAdapters) {
        const listName = listAdapter.key

        relations[listName] = []
        for (const field of listAdapter.fieldAdapters) {
            if (field.fieldName === 'Relationship') {
                relations[listName].push(field.refListKey)
                if (field.field.many) {
                    manyToManyLists[listName] = field.refListKey
                }
            }
        }
    }

    for (const [listName, listRelations] of Object.entries(relations)) {
        for (const relationName of listRelations) {
            if (relations[relationName].includes(listName)) {
                connectedLists[listName] = relationName
                connectedLists[relationName] = listName
            }
        }
    }

    logger.info({ connectedLists })
    logger.info({ manyToManyLists })

    for (const listAdapter of listAdapters) {

        const listName = listAdapter.key
        cache[listName] = {}

        const fields = listAdapter.fieldAdaptersByPath
        if (!fields[UPDATED_AT_FIELD] || !fields[UPDATED_AT_FIELD]) {
            logger.info(`ADAPTER_CACHE: Cache is NOT enabled for list: ${listName} -> No ${UPDATED_AT_FIELD} field`)
            continue
        }

        if (excludedLists.includes(listName) ||
            !includeAllLists && !includedLists.includes(listName)) {
            logger.info(`ADAPTER_CACHE: Cache is NOT enabled for list: ${listName} -> Cache is not included by config`)
            continue
        }

        logger.info(`ADAPTER_CACHE: Cache is enabled for list: ${listName}`)

        // Patch public queries from BaseKeystoneList:

        const originalItemsQuery = listAdapter.itemsQuery
        const getItemsQueryKey = ([args, opts]) => `${JSON.stringify(args)}_${get(opts, 'from', null)}_${JSON.stringify(get(opts, ['context', 'authedItem', 'id']))}`
        const getItemsQueryCondition = ([args]) => get(args, ['where'])
        listAdapter.itemsQuery = patchAdapterQueryFunction(listName, 'itemsQuery', originalItemsQuery, listAdapter, middleware, getItemsQueryKey, getItemsQueryCondition, relations)

        const originalFind = listAdapter.find
        const getFindKey = ([condition]) => `${JSON.stringify(condition)}`
        const getFindCondition = ([condition]) => condition
        listAdapter.find = patchAdapterQueryFunction(listName, 'find', originalFind, listAdapter, middleware, getFindKey, getFindCondition, relations)

        const originalFindById = listAdapter.findById
        const getFindByIdKey = ([id]) => `${id}`
        listAdapter.findById = patchAdapterQueryFunction(listName, 'findById', originalFindById, listAdapter, middleware, getFindByIdKey)

        const originalFindOne = listAdapter.findOne
        const getFindOneKey = ([condition]) => `${JSON.stringify(condition)}`
        listAdapter.findOne = patchAdapterQueryFunction(listName, 'findOne', originalFindOne, listAdapter, middleware, getFindOneKey, getFindCondition, relations)

        // Patch mutations:

        const originalUpdate = listAdapter.update
        listAdapter.update = patchAdapterFunction(listName, 'update', originalUpdate, listAdapter, middleware, connectedLists, manyToManyLists)

        const originalCreate = listAdapter.create
        listAdapter.create = patchAdapterFunction(listName, 'create', originalCreate, listAdapter, middleware, connectedLists, manyToManyLists)

        const originalDelete = listAdapter.delete
        listAdapter.delete = patchAdapterFunction(listName, 'delete', originalDelete, listAdapter, middleware, connectedLists, manyToManyLists)
    }
}

/**
 * Patches a keystone mutation to add cache functionality
 * @param {string} listName
 * @param {string} functionName
 * @param {function} f
 * @param {Object} listAdapter
 * @param {AdapterCache} cache
 * @returns {function(...[*]): Promise<*>}
 */
function patchAdapterFunction ( listName, functionName, f, listAdapter, cache, connectedLists, manyToManyLists) {
    return async ( ...args ) => {

        const functionResult = await f.apply(listAdapter, args)

        await cache.setState(listName, functionResult[UPDATED_AT_FIELD])
        if (connectedLists[listName]) {
            await cache.setState(connectedLists[listName], functionResult[UPDATED_AT_FIELD])
        }

        if (manyToManyLists[listName]) {
            await cache.setState(manyToManyLists[listName], functionResult[UPDATED_AT_FIELD])
        }

        const cacheEvent = cache.getCacheEvent({
            type: 'DROP',
            functionName,
            list: listName,
            key: listName,
            result: functionResult,
        })
        cache.logEvent({ event: cacheEvent })

        return functionResult
    }
}

function patchAdapterQueryFunction (listName, functionName, f, listAdapter, cache, getKey, getQuery = () => null, relations = {}) {
    return async ( ...args ) => {
        cache.totalRequests++

        let key = getKey(args)
        if (key) {
            key = `${listName}_${functionName}_${key}`
        }

        let response = []
        const cached = key ? cache.cache[listName][key] : null
        const listLastUpdate = await cache.getState(listName)

        if (cached) {
            const cacheLastUpdate = cached.lastUpdate
            if (cacheLastUpdate && cacheLastUpdate.getTime() === listLastUpdate.getTime()) {
                cache.cacheHits++
                const cacheEvent = cache.getCacheEvent({
                    type: 'HIT',
                    functionName,
                    list: listName,
                    key,
                    result: JSON.stringify(cached.response),
                })
                cache.logEvent({ event: cacheEvent })

                return cloneDeep(cached.response)
            }
        }

        response = await f.apply(listAdapter, args)
        const copiedResponse = cloneDeep(response)

        const shouldCache = !queryIsComplex(getQuery(args), listName, relations)
        if (shouldCache) {
            cache.cache[listName][key] = {
                lastUpdate: listLastUpdate,
                response: copiedResponse,
            }
        }

        const cacheEvent = cache.getCacheEvent({
            type: 'MISS',
            functionName,
            key,
            list: listName,
            result: { copiedResponse, cached: shouldCache },
        })
        cache.logEvent({ event: cacheEvent })

        return response
    }
}

function queryIsComplex (query, list, relations) {

    if (!query) { return false }

    const relsForList = get(relations, list)
    for (const rel of relsForList) {
        if (queryHasField(query, rel. toLowerCase())) {
            return true
        }
    }

    return false
}

module.exports = {
    AdapterCache,
}