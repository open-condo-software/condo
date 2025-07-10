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
 * State -- saved in redis and contains integer, describing number of list updates since initialization of the cache.
 * State part example: { "User": 25 } // since the init. of the cache list user was updated 25 times!
 *
 * Cache -- saved internally in instance.
 * Cache part example: { "User_where:{id'1'}_first:1_sortBy:['createdAt']": { result: <User>, listState: 15, listName: 'User' } ] } }
 *
 * For every list patch listAdapter function:
 * If request to this list is Query:
 *  1. check if request is in cache
 *  2. check cached value is actual*
 *      * cached item with {listName} and {result} is considered actual if its {listState} called localState is equal to state that is saved in redis.
 *      * in other words, we check that the {listName} WAS NOT UPDATED since cache was set.
 *  3. If checks are passed:
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
 * Notes:
 *
 * - Adapter level cache do not cache complex requests. A request is considered complex, if Where query contains other relationships
 *  - Knex implicitly (without calling .update()) performs updates on many:true fields.
 *    Implicit updates are present in two private knex adapter methods: _createOrUpdateField() and _setNullByValue()
 *    It happens in case of update/create on many:true field and leads to inconsistent cache state.
 *    We overcome this by explicitly patching those two methods to raise exception whenever they are called.
 *    We also do not cache lists that have many: true relations or are dependant of this relations.
 */

const { get, cloneDeep, floor, isEqual } = require('lodash')
const LRUCache = require('lru-cache')

const { getListAdapters } = require('@open-condo/keystone/databaseAdapters/utils')

const { getExecutionContext } = require('./executionContext')
const { getKVClient } = require('./kv')
const { getLogger } = require('./logging')
const Metrics = require('./metrics')
const { queryHasField } = require('./queryHasField')

const STATE_REDIS_KEY_PREFIX = 'adapterCacheState'
const METRIC_PREFIX = 'adapterCache'
const ADAPTER_CACHE_HITRATE_METRIC_NAME = METRIC_PREFIX + '.hitrate'
const ADAPTER_CACHE_TOTAL_METRIC_NAME = METRIC_PREFIX + '.total'
const ADAPTER_CACHE_LRU_DROPS_METRIC_NAME = METRIC_PREFIX + '.drops.lru'
const ADAPTER_CACHE_LIST_UPD_DROPS_METRIC_NAME = METRIC_PREFIX + '.drops.listupdate'
const ADAPTER_CACHE_HITS_METRIC_NAME = METRIC_PREFIX + '.hits'
const ADAPTER_CACHE_KEYS_METRIC_NAME = METRIC_PREFIX + '.keys'

const logger = getLogger('adapter-cache')

class AdapterCache {

    constructor ({ enabled, debugMode, excludedLists, maxCacheKeys, logging, logStatsEachSecs }) {
        try {
            this.enabled = !!enabled

            // If debug mode is turned on, then an additional request would be made to database on cached queries.
            // If cached data differs from response, then an error is logged
            // SHOULD NOT BE USED IN PRODUCTION MODE
            this.debugMode = !!debugMode

            // Redis is used as State:
            // Note: Redis installation is modified with custom commands. Check getStateRedisClient for details
            // State: { listName -> state }
            this.redisClient = getStateRedisClient()

            // This mechanism allows to skip caching some lists.
            // Useful for hotfixes or disabling cache for business critical lists
            this.excludedLists = excludedLists || []

            // This mechanism allows to control garbage collection.
            this.maxCacheKeys = maxCacheKeys || 1000

            this.logging = !!logging

            // Stats
            this.logStatsEachSecs = logStatsEachSecs || 60
            this.totalRequests = 0
            this.cacheHits = 0
            this.totalDropsOnListChange = 0
            this.totalDropsOnLRU = 0

            // Cache: { listName -> queryKey -> { response, listScore } }
            this.cache = new LRUCache({ max: this.maxCacheKeys, dispose: () => this.totalDropsOnLRU++ })

            // Log statistics each <provided> seconds
            if (this.enabled) this.statsInterval = setInterval(() => this._logStats(), this.logStatsEachSecs * 1000)
            if (this.enabled) this.metricsInterval = setInterval(() => this._logMetrics(), 1000)
        } catch (e) {
            this.enabled = false
            logger.warn({ msg: 'ADAPTER_CACHE: Bad config', err: e })
        }
    }

    /**
     * Increments an update to list in Redis storage
     * @param {string} listName -- List name
     * @returns {Promise<void>}
     */
    async dropStateByList (listName) {
        const prefixedKey = `${STATE_REDIS_KEY_PREFIX}:${listName}`
        await this.redisClient.incr(prefixedKey)
    }

    /**
     * Returns current list update count from Redis
     * @param {string} listName -- List name
     * @returns {Promise<number>}
     */
    async getState (listName) {
        const prefixedKey = `${STATE_REDIS_KEY_PREFIX}:${listName}`
        const stateFromRedis = await this.redisClient.get(prefixedKey)
        if (stateFromRedis) {
            if (!isNaN(stateFromRedis)) { return stateFromRedis }
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
                this.cache.delete(key)
                this.totalDropsOnListChange++
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
    logEvent ({ type, functionName, listName, key, result }) {
        if (!this.logging) return

        logger.info({
            msg: 'adapter cache event',
            listKey: listName,
            type,
            data: {
                functionName,
                listName,
                key,
                result,
                context: getExecutionContext(),
            },
        })
    }

    async prepareMiddleware ({ keystone }) {
        if (this.enabled) {
            await patchKeystoneWithAdapterCache(keystone, this)
            logger.info('Adapter level cache ENABLED')
        } else {
            logger.info('Adapter level cache NOT ENABLED')
        }
    }

    _getHitrate = () => {
        if (this.totalRequests !== 0) {
            return this.cacheHits / this.totalRequests
        } else {
            return 0
        }
    }

    _logStats = () => {
        logger.info({
            msg: 'adapter cache stats',
            data: {
                stats: {
                    hits: this.cacheHits,
                    total: this.totalRequests,
                    hitrate: floor(this._getHitrate(), 2),
                    totalKeys: this.cache.size,
                    totalDrops: this.totalDropsOnLRU + this.totalDropsOnListChange,
                    totalDropsOnLRU: this.totalDropsOnLRU,
                    totalDropsOnListChange: this.totalDropsOnListChange,
                },
            },
        })
    }

    _logMetrics = () => {
        Metrics.gauge({ name: ADAPTER_CACHE_HITRATE_METRIC_NAME, value: this._getHitrate() })
        Metrics.gauge({ name: ADAPTER_CACHE_TOTAL_METRIC_NAME, value: this.totalRequests })
        Metrics.gauge({ name: ADAPTER_CACHE_HITS_METRIC_NAME, value: this.cacheHits })
        Metrics.gauge({ name: ADAPTER_CACHE_KEYS_METRIC_NAME, value: this.cache.size })
        Metrics.gauge({ name: ADAPTER_CACHE_LRU_DROPS_METRIC_NAME, value: this.totalDropsOnLRU })
        Metrics.gauge({ name: ADAPTER_CACHE_LIST_UPD_DROPS_METRIC_NAME, value: this.totalDropsOnListChange })
    }
}

/**
 * Patches an internal keystone adapter adding cache functionality
 * @param keystone
 * @param {AdapterCache} cacheAPI
 * @returns {Promise<void>}
 */
async function patchKeystoneWithAdapterCache (keystone, cacheAPI) {
    const cache = cacheAPI.cache
    const excludedLists = cacheAPI.excludedLists
    const listAdapters = Object.values(getListAdapters(keystone))

    // Step 1: Preprocess lists.
    const relations = {}               // list -> [{list, path, many}]
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

    logger.info({ msg: 'Adapter cache preprocessing finished:', data: { relations, listsWithMany } })

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

        // 1. It is explicitly specified in config that list should not be cached
        if (excludedLists.includes(listName)) {
            disabledLists.push({ listName, reason: 'Cache is excluded by config' })
            continue
        }

        // 2. It is a dependent of many:true field or has many:true relation.
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
        listAdapter.update = getMutationFunctionWithCache(listName, 'update', originalUpdate, listAdapter, cacheAPI)

        const originalCreate = listAdapter.create
        listAdapter.create = getMutationFunctionWithCache(listName, 'create', originalCreate, listAdapter, cacheAPI)

        const originalDelete = listAdapter.delete
        listAdapter.delete = getMutationFunctionWithCache(listName, 'delete', originalDelete, listAdapter, cacheAPI)

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
        msg: 'adapter cache setup complete',
        data: {
            enabledLists,
            disabledLists,
        },
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
function getMutationFunctionWithCache (listName, functionName, f, listAdapter, cacheAPI) {
    return async (...args) => {

        // Get mutation value
        const functionResult = await f.apply(listAdapter, args)

        // Drop global state and local cache
        await cacheAPI.dropStateByList(listName)
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
    return async (...args) => {

        cacheAPI.incrementTotal()

        let key = getKey(args)
        if (key) {
            key = `${listName}_${functionName}_${key}`
        }

        let response = []
        const cachedItem = key ? cacheAPI.getCache(key) : null
        const listState = await cacheAPI.getState(listName)

        if (cachedItem) {
            const localListState = cachedItem.listState
            if (localListState && localListState === listState) {
                cacheAPI.incrementHit()

                cacheAPI.logEvent({
                    type: 'HIT',
                    functionName,
                    listName,
                    key,
                    result: cachedItem,

                })

                const cachedResponse = cloneDeep(cachedItem.response)

                if (cacheAPI.debugMode) {
                    response = await f.apply(listAdapter, args)
                    if (!isEqual(response, cachedResponse)) {
                        cacheAPI.logEvent({
                            type: 'BAD_CACHE',
                            functionName,
                            key,
                            listName,
                            result: { cachedResponse, response },
                        })
                    }
                }

                return cachedResponse
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
                listState: listState,
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

function getStateRedisClient () {
    return getKVClient('cache')
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
