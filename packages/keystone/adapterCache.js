/**
 * Keystone database adapter level cache
 *
 *
 * Problem:
 *
 * To understand how adapterCache works we need to understand the environment and the tasks that this feature solve
 * 1. Your web app has multiple instances, but single database
 * 2. You use Redis
 * 3. You need a mechanism to lower the number of SQL queries to your DB
 *
 *
 * Algorithm:
 *
 * Adapter cache has two variables:
 *
 * State -- saved in redis and contains last date of update (update_time) on every GQL List.
 * State part example: { "User": "1669912192723" }
 *
 * Cache -- saved internally in instance.
 * Cache part example: { "User_where:{id'1'}_first:1_sortBy:['createdAt']": { result: <User>, updateTime: '1669912192723', listName: 'User' } ] } }
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
 *
 * Implementation:
 *
 * Adapter cache gets initialized keystone database adapter and decorates all public methods, that are responsible for Query and Mutation operations adding caching functionality.
 *
 *
 * Statistics:
 *
 * - If cache logging is turned on, then statistics is shown on any log event..
 *
 * Notes:
 *
 * - Adapter level cache do not cache complex requests. A request is considered complex, if Where query contains other relationships
 *  - Knex implicitly (without calling .update()) performs updates on many:true fields.
 *    Implicit updates are present in two private knex adapter methods: _createOrUpdateField() and _setNullByValue()
 *    It happens in case of update/create on many:true field and leads to inconsistent cache state.
 *    We overcome this by explicitly patching those two methods to raise exception whenever they are called.
 *    We also do not cache lists that have many: true relations or are dependant of this relations.
 */

const { get, cloneDeep, floor } = require('lodash')
const LRUCache = require('lru-cache')

const { getLogger } = require('./logging')
const { queryHasField } = require('./queryHasField')
const { getRedisClient } = require('./redis')

const UPDATED_AT_FIELD = 'updatedAt'
const STATE_REDIS_KEY_PREFIX = 'adapterCacheState'

const logger = getLogger('adapterCache')


class AdapterCache {

    constructor ( { enabled, excludedLists, maxCacheKeys, logging, logStatTime } ) {
        try {
            this.enabled = !!enabled

            // Redis is used as State:
            // Note: Redis installation is modified with custom commands. Check getStateRedisClient for details
            // State: { listName -> lastUpdate }
            this.redisClient = getStateRedisClient()

            // This mechanism allows to skip caching some lists.
            // Useful for hotfixes or disabling cache for business critical lists
            this.excludedLists = excludedLists || []

            // This mechanism allows to control garbage collection.
            this.maxCacheKeys = maxCacheKeys || 1000

            // Cache: { listName -> queryKey -> { response, lastUpdate, score } }
            this.cache = new LRUCache({ max: this.maxCacheKeys })

            // Log statistics each <provided> seconds
            this.logStatTime = logStatTime || 60

            // Logging allows to get the percentage of cache hits
            this.logging = !!logging

            this.totalRequests = 0
            this.cacheHits = 0

        } catch (e) {
            this.enabled = false
            logger.warn({ msg: 'ADAPTER_CACHE: Bad config', err: e })
        }
    }

    /**
     * Sets last updated list time to Redis storage
     * @param {string} listName -- List name
     * @param {Date} time -- Last updated time
     * @returns {Promise<void>}
     */
    async setState (listName, time) {
        const serializedTime = time.valueOf()
        const prefixedKey = `${STATE_REDIS_KEY_PREFIX}:${listName}`
        await this.redisClient.tryToUpdateCacheStateByNewTimestamp(prefixedKey, serializedTime)
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

    /**
     * Set value to cache
     * @param {string} listName
     * @param {string} key
     * @param {Object} value
     */
    setCache (listName, key, value) {
        value.listName = listName
        this.cache.set(key, value)
    }

    /**
     * Get cached value. Returns undefined if value is not in cache
     * @param {string} key
     * @returns {Object || undefined}
     */
    getCache (key) {
        return this.cache.get(key)
    }

    /**
     * Drops all local cache items, that are associated with given list
     * @param {string} listName
     */
    dropCacheByList (listName) {
        this.cache.forEach((cachedItem, key) => {
            if (get(cachedItem, 'listName') === listName) {
                this.cache.del(key)
            }
        })
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
     * Logs cache event.
     * @param {Object} event
     */
    logEvent ( { type, functionName, listName, key, result } ) {
        if (!this.logging) return

        const cacheEvent = {
            type,
            functionName,
            listName,
            key,
            result,
            meta: this.getStats(),
        }

        logger.info(cacheEvent)
    }

    /**
     * Calculate total size of items held in cache
     * @returns {number}
     */
    getCacheSize = () => {
        return this.cache.size
    }

    getStats = () => {
        return {
            hits: this.cacheHits,
            total: this.totalRequests,
            hitrate: floor(this.cacheHits / this.totalRequests, 2),
            totalKeys: this.getCacheSize(),
        }
    }

    async prepareMiddleware ({ keystone }) {
        if (this.enabled) {
            await patchKeystoneWithAdapterCache(keystone, this)
            logger.info('Adapter level cache ENABLED')
        } else {
            logger.info('Adapter level cache NOT ENABLED')
        }
    }
}

/**
 * Patches an internal keystone adapter adding cache functionality
 * @param keystone
 * @param {AdapterCache} cacheAPI
 * @returns {Promise<void>}
 */
async function patchKeystoneWithAdapterCache (keystone, cacheAPI) {
    const keystoneAdapter = keystone.adapter

    const cache = cacheAPI.cache
    const excludedLists = cacheAPI.excludedLists

    const listAdapters = Object.values(keystoneAdapter.listAdapters)

    // Step 1: Preprocess lists.
    const relations = {}        // list -> [{list, path, many}]
    const manyRefs = new Set()  // lists that are referenced in many: true relations
    const manyLists = new Set() // lists that have many: true relations

    listAdapters.forEach(({ key: listName, fieldAdapters }) => {
        fieldAdapters.forEach(({ fieldName, refListKey, field }) => {
            const path = get(field, 'path')

            if (fieldName === 'Relationship') {
                const many = get(field, 'many', false)

                if (!relations[listName]) { relations[listName] = [] }
                relations[listName].push({
                    path,
                    many,
                    list: refListKey,
                })

                if (many) {
                    manyLists.add(listName)
                    manyRefs.add(refListKey)
                }
            }
        })
    })

    const listsWithMany = new Set([...manyLists, ...manyRefs])

    logger.info({ msg: 'Adapter cache preprocessing finished:', relations, listsWithMany })

    // Step 2: Iterate over lists, patch mutations and queries inside list.

    const enabledLists = []
    const disabledLists = []

    const getItemsQueryKey = ([args, opts]) => `${JSON.stringify(args)}`
    const getItemsQueryCondition = ([args]) => get(args, ['where'])
    const getFindKey = ([condition]) => `${JSON.stringify(condition)}`
    const getFindCondition = ([condition]) => condition
    const getFindByIdKey = ([id]) => `${id}`
    const getFindAllKey = () => ''
    const getFindOneKey = ([condition]) => `${JSON.stringify(condition)}`

    for (const listAdapter of listAdapters) {

        const listName = listAdapter.key
        cache[listName] = {}

        // Skip patching list if:

        // 1. No updatedAt field!
        const fields = listAdapter.fieldAdaptersByPath
        if (!fields[UPDATED_AT_FIELD] || !fields[UPDATED_AT_FIELD]) {
            disabledLists.push({ listName, reason: `No ${UPDATED_AT_FIELD} field` })
            continue
        }

        // 2. It is explicitly specified in config that list should not be cached
        if (excludedLists.includes(listName)) {
            disabledLists.push({ listName, reason: 'Cache is excluded by config' })
            continue
        }

        // 3. It is a dependent of many:true field or has many:true relation.
        if (listsWithMany.has(listName)) {
            disabledLists.push({ listName, reason: 'List is a dependant of many: true relation or has many:true relation' })
            continue
        }
        
        enabledLists.push(listName)

        // Patch public queries from BaseKeystoneList:

        const originalItemsQuery = listAdapter.itemsQuery
        listAdapter.itemsQuery = getQueryFunctionWithCache(listName, 'itemsQuery', originalItemsQuery, listAdapter, cacheAPI, getItemsQueryKey, getItemsQueryCondition, relations)

        const originalFind = listAdapter.find
        listAdapter.find = getQueryFunctionWithCache(listName, 'find', originalFind, listAdapter, cacheAPI, getFindKey, getFindCondition, relations)

        const originalFindById = listAdapter.findById
        listAdapter.findById = getQueryFunctionWithCache(listName, 'findById', originalFindById, listAdapter, cacheAPI, getFindByIdKey)

        const originalFindOne = listAdapter.findOne
        listAdapter.findOne = getQueryFunctionWithCache(listName, 'findOne', originalFindOne, listAdapter, cacheAPI, getFindOneKey, getFindCondition, relations)

        const originalFindAll = listAdapter.findAll
        listAdapter.findAll = getQueryFunctionWithCache(listName, 'findAll', originalFindAll, listAdapter, cacheAPI, getFindAllKey)

        // Patch mutations:

        const originalUpdate = listAdapter.update
        listAdapter.update = getMutationFunctionWithCache(listName, 'update', originalUpdate, listAdapter, cacheAPI )

        const originalCreate = listAdapter.create
        listAdapter.create = getMutationFunctionWithCache(listName, 'create', originalCreate, listAdapter, cacheAPI )

        const originalDelete = listAdapter.delete
        listAdapter.delete = getMutationFunctionWithCache(listName, 'delete', originalDelete, listAdapter, cacheAPI )

        // A Knex only stabs!
        // Knex has internal functionality that updates database in implicit fashion.
        // If any of these functions are called, cache becomes inconsistent and yields incorrect results.

        listAdapter._createOrUpdateField = async () => {
            throw new Error(`Knex listAdapter._createOrUpdateField is called! This means, this cache works incorrectly! You should either disable caching for list ${listName} or check your code. You should not have editable many:true fields in your code!`)
        }

        listAdapter._setNullByValue = async () => {
            throw new Error(`Knex listAdapter._setNullByValue is called! This means, this cache works incorrectly! You should either disable caching for list ${listName} or check your code.`)
        }
    }

    // Step 3: Log results

    logger.info({
        enabledLists,
        disabledLists,
    })
}

/**
 * Decorates keystone mutation functions to add cache functionality.
 * This function is called on every create, update, delete, / many called inside adapter
 * @param {string} listName
 * @param {string} functionName
 * @param {function} f
 * @param {Object} listAdapter
 * @param {AdapterCache} cacheAPI
 * @returns {function(...[*]): Promise<*>}
 */
function getMutationFunctionWithCache ( listName, functionName, f, listAdapter, cacheAPI ) {
    return async ( ...args ) => {

        // Get mutation value
        const functionResult = await f.apply(listAdapter, args)

        // Drop global state and local cache
        await cacheAPI.setState(listName, functionResult[UPDATED_AT_FIELD])
        cacheAPI.dropCacheByList(listName)

        cacheAPI.logEvent({
            type: 'DROP',
            functionName,
            listName,
            key: listName,
            result: functionResult,
        })

        return functionResult
    }
}

/**
 * Decorates keystone adapter query function, adding cache functionality
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
function getQueryFunctionWithCache (listName, functionName, f, listAdapter, cacheAPI, getKey, getQuery = () => null, relations = {}) {
    return async ( ...args ) => {
        cacheAPI.incrementTotal()

        let key = getKey(args)
        if (key) {
            key = `${listName}_${functionName}_${key}`
        }

        let response = []
        const cachedItem = key ? cacheAPI.getCache(key) : null
        const listLastUpdate = await cacheAPI.getState(listName)

        if (cachedItem) {
            const cacheLastUpdate = cachedItem.lastUpdate
            if (cacheLastUpdate && cacheLastUpdate.getTime() === listLastUpdate.getTime()) {
                cacheAPI.incrementHit()

                cacheAPI.logEvent({
                    type: 'HIT',
                    functionName,
                    listName,
                    key,
                    result: cachedItem,
                })

                return cloneDeep(cachedItem.response)
            }
        }

        response = await f.apply(listAdapter, args)
        const copiedResponse = cloneDeep(response)

        // Note: This solution does not cache complex requests.
        //       Request is considered complex if it has relations in its where query/condition.
        //       Check queryIsComplex docstring for details
        const shouldCache = !queryIsComplex(getQuery(args), listName, relations)
        if (shouldCache) {
            cacheAPI.setCache(listName, key, {
                lastUpdate: listLastUpdate,
                response: copiedResponse,
            })
        }
        
        cacheAPI.logEvent({
            type: 'MISS',
            functionName,
            key,
            listName,
            result: { copiedResponse, cached: shouldCache },
        })

        return response
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
function getStateRedisClient () {
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

    const redis = getRedisClient('cache')
    redis.defineCommand('tryToUpdateCacheStateByNewTimestamp', updateTimeStampFunction)
    return redis
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
    const relsForList = get(relations, list, [])
    for (const { path } of relsForList) {
        if (queryHasField(query, path))
            return true
    }
    return false
}

module.exports = {
    AdapterCache,
}