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
 *
 * Statistics:
 *  - If cache logging is turned on, then statistics is shown on any log event.
 *
 * Garbage collection:
 *  - Every request total number of keys in cache is checked. If total number of keys is greater than maxCacheKeys, keysToDelete with lowest score are deleted from cache.
 *
 * Notes:
 *  - Adapter level cache do not cache complex requests. A request is considered complex, if Where query contains other relationships
 *
 */

const { get, size, cloneDeep, sortBy, floor } = require('lodash')
const LRUCache = require('lru-cache')

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

            // Redis is used as State:
            // Note: Redis installation is modified with custom commands. Check getStateRedisClient for details
            // State: { listName -> lastUpdate }
            this.redisClient = this.getStateRedisClient()

            // This mechanism allows to skip caching some lists.
            // Useful for hotfixes or disabling cache for business critical lists
            this.excludedLists = get(parsedConfig, 'excludedLists', [])

            // This mechanism allows to control garbage collection.
            this.maxCacheKeys = get(parsedConfig, 'maxCacheKeys', 1000)

            // Cache: { listName -> queryKey -> { response, lastUpdate, score } }
            //this.cache = new LRUCache({ maxSize: this.maxCacheKeys, sizeCalculation: () => this.getCacheSize() })
            this.cache = {}

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

    setCache (listName, key, value) {
        value.listName = listName
        this.cache[listName][key] = value
    }

    getCache (listName, key) {
        return this.cache[listName][key]
    }

    /**
     * Drops local cache on list
     * @param {string} listName
     */
    dropCacheByList (listName) {
        this.cache[listName] = {}
    }

    /**
     * Get total number of requests
     * @returns {number}
     */
    getTotal () {
        return this.totalRequests
    }

    /**
     * Get total number of cache hits
     * @returns {number}
     */
    getHits () {
        return this.cacheHits
    }

    /**
     * Scores cache hit
     * @returns {number}
     */
    incrementHit () {
        return this.cacheHits++
    }

    /**
     * Used to score total requests
     * @returns {number}
     */
    incrementTotal () {
        return this.totalRequests++
    }

    /**
     * Gets a serialized cache event item for logging
     * @param {string} type
     * @param {string} functionName
     * @param {string} key
     * @param {string} list
     * @param {object} result
     * @returns {{response, meta: {hits: number, total: number, totalKeys: number}, function, type, list, key}}
     */
    getCacheEvent ({ type, functionName, key, list, result }) {
        return ({
            type: type,
            function: functionName,
            list: list,
            key: key,
            response: result,
            meta: {
                hits: this.getHits(),
                total: this.getTotal(),
                hitrate: floor(this.getHits() / this.getTotal(), 2),
                totalKeys: this.getCacheSize(),
            },
        })
    }

    /**
     * Logs cache event. Cache event could be obtained via getCacheEvent
     * @param event
     */
    logEvent ({ event }) {
        if (!this.logging) return
        logger.info(event)
    }

    /**
     * Calculate total size of items held in cache
     * @returns {number}
     */
    getCacheSize = () => {
        let result = 0
        Object.entries(this.cache).forEach(([_, keysByList]) => {
            result += size(keysByList)
        })
        return result
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
 * @param {AdapterCache} cacheAPI
 * @returns {Promise<void>}
 */
async function patchKeystoneAdapterWithCacheMiddleware (keystone, cacheAPI) {
    const keystoneAdapter = keystone.adapter

    const cache = cacheAPI.cache
    const excludedLists = cacheAPI.excludedLists

    const listAdapters = Object.values(keystoneAdapter.listAdapters)

    // Step 1: Calculate relations and connected lists.
    // Lists are connected if both of them have a relation to one another. Example: Books -> Author and Author -> Books
    const connectedLists = {}
    const relations = {}

    for (const listAdapter of listAdapters) {
        const listName = listAdapter.key

        relations[listName] = []
        for (const field of listAdapter.fieldAdapters) {
            if (field.fieldName === 'Relationship') {
                relations[listName].push(field.refListKey)
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

    // Step 2: Iterate over lists, patch mutations and queries inside list.

    for (const listAdapter of listAdapters) {

        const listName = listAdapter.key
        cache[listName] = {}

        const fields = listAdapter.fieldAdaptersByPath
        if (!fields[UPDATED_AT_FIELD] || !fields[UPDATED_AT_FIELD]) {
            logger.info(`ADAPTER_CACHE: Cache is NOT enabled for list: ${listName} -> No ${UPDATED_AT_FIELD} field`)
            continue
        }

        if (excludedLists.includes(listName)) {
            logger.info(`ADAPTER_CACHE: Cache is NOT enabled for list: ${listName} -> Cache is not included by config`)
            continue
        }

        logger.info(`ADAPTER_CACHE: Cache is enabled for list: ${listName}`)

        // Patch public queries from BaseKeystoneList:

        const originalItemsQuery = listAdapter.itemsQuery
        const getItemsQueryKey = ([args, opts]) => `${JSON.stringify(args)}_${get(opts, 'from', null)}_${JSON.stringify(get(opts, ['context', 'authedItem', 'id']))}`
        const getItemsQueryCondition = ([args]) => get(args, ['where'])
        listAdapter.itemsQuery = patchAdapterQueryFunction(listName, 'itemsQuery', originalItemsQuery, listAdapter, cacheAPI, getItemsQueryKey, getItemsQueryCondition, relations)

        const originalFind = listAdapter.find
        const getFindKey = ([condition]) => `${JSON.stringify(condition)}`
        const getFindCondition = ([condition]) => condition
        listAdapter.find = patchAdapterQueryFunction(listName, 'find', originalFind, listAdapter, cacheAPI, getFindKey, getFindCondition, relations)

        const originalFindById = listAdapter.findById
        const getFindByIdKey = ([id]) => `${id}`
        listAdapter.findById = patchAdapterQueryFunction(listName, 'findById', originalFindById, listAdapter, cacheAPI, getFindByIdKey)

        const originalFindOne = listAdapter.findOne
        const getFindOneKey = ([condition]) => `${JSON.stringify(condition)}`
        listAdapter.findOne = patchAdapterQueryFunction(listName, 'findOne', originalFindOne, listAdapter, cacheAPI, getFindOneKey, getFindCondition, relations)

        // Patch mutations:

        const originalUpdate = listAdapter.update
        listAdapter.update = patchAdapterFunction(listName, 'update', originalUpdate, listAdapter, cacheAPI, connectedLists )

        const originalCreate = listAdapter.create
        listAdapter.create = patchAdapterFunction(listName, 'create', originalCreate, listAdapter, cacheAPI, connectedLists )

        const originalDelete = listAdapter.delete
        listAdapter.delete = patchAdapterFunction(listName, 'delete', originalDelete, listAdapter, cacheAPI, connectedLists )
    }
}

/**
 * Patches a keystone mutation to add cache functionality
 * @param {string} listName
 * @param {string} functionName
 * @param {function} f
 * @param {Object} listAdapter
 * @param {AdapterCache} cache
 * @param {Object} connectedLists
 * @returns {function(...[*]): Promise<*>}
 */
function patchAdapterFunction ( listName, functionName, f, listAdapter, cache, connectedLists ) {
    return async ( ...args ) => {

        // Get mutation value
        const functionResult = await f.apply(listAdapter, args)

        // Drop global state and local cache
        await cache.setState(listName, functionResult[UPDATED_AT_FIELD])
        cache.dropCacheByList(listName)

        // Handle connected lists if there are any.
        // If one side of connected list is updated, then we drop the other side cache too.
        // If Author -> Books and Books -> Author, then if Author is updated, Books is dropped. And vice-versa
        if (connectedLists[listName]) {
            await cache.setState(connectedLists[listName], functionResult[UPDATED_AT_FIELD])
            cache.dropCacheByList(listName)
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

/**
 * Patch adapter query function, adding cache functionality
 * @param {string} listName
 * @param {string} functionName
 * @param {function} f
 * @param {Object} listAdapter
 * @param {AdapterCache} cacheAPI
 * @param {function} getKey get key function. Called with arguments of f
 * @param {function} getQuery get query from args. Called with arguments of f
 * @param {Object} relations
 * @returns {(function(...[*]): Promise<*|*[]>)|*}
 */
function patchAdapterQueryFunction (listName, functionName, f, listAdapter, cacheAPI, getKey, getQuery = () => null, relations = {}) {
    return async ( ...args ) => {
        cacheAPI.incrementTotal()

        let key = getKey(args)
        if (key) {
            key = `${listName}_${functionName}_${key}`
        }

        let response = []
        const cached = key ? cacheAPI.getCache(listName, key) : null
        const listLastUpdate = await cacheAPI.getState(listName)

        if (cached) {
            const cacheLastUpdate = cached.lastUpdate
            if (cacheLastUpdate && cacheLastUpdate.getTime() === listLastUpdate.getTime()) {
                cacheAPI.incrementHit()
                const cacheEvent = cacheAPI.getCacheEvent({
                    type: 'HIT',
                    functionName,
                    list: listName,
                    key,
                    result: { response: JSON.stringify(cached.response), score: cached.score },
                })
                cacheAPI.logEvent({ event: cacheEvent })

                return cloneDeep(cached.response)
            }
        }

        response = await f.apply(listAdapter, args)
        const copiedResponse = cloneDeep(response)

        // Note: do not cache complex requests. Check queryIsComplex docstring for details
        // Todo (@toplenboren) (DOMA-2681) Sometimes listName !== fieldName. Think about these cases!
        const shouldCache = !queryIsComplex(getQuery(args), listName, relations)
        if (shouldCache) {
            cacheAPI.setCache(listName, key, {
                lastUpdate: listLastUpdate,
                response: copiedResponse,
            })
        }

        const cacheEvent = cacheAPI.getCacheEvent({
            type: 'MISS',
            functionName,
            key,
            list: listName,
            result: { copiedResponse, cached: shouldCache },
        })
        cacheAPI.logEvent({ event: cacheEvent })

        return response
    }
}

/**
 * Query is complex if it searches on a relation. Example: allBooks(where: {author: { id: ...}})
 * @param {object} query - A Keystone GraphQL search query. Like { id: "1" }
 * @param {string} list - a name of the list
 * @param {object} relations - an object describing all relations in the project
 * @returns {boolean}
 */
function queryIsComplex (query, list, relations) {
    if (!query) { return false }
    const relsForList = get(relations, list)
    for (const rel of relsForList) {
        if (queryHasField(query, rel. toLowerCase()))
            return true
    }
    return false
}

module.exports = {
    AdapterCache,
}