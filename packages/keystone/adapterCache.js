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
 * If request to this list is Query ->
 * 1. check if request is in cache
 * 2. check if cache last update time equals state last update time
 * 3. If both checks are passed, then return value from cache, else get value from DB, update cache
 * If request to this list is Mutation (anything that mutates the data) ->
 * 1. update state on this list to the update time of the updated/created/deleted object
 *
 * Usage:
 * 1. Configure adapterCache with .env values
 * 2. Call new AdapterCacheMiddleware(config) in index.js
 */

const { get, cloneDeep } = require('lodash')
const { getRedisClient } = require('./redis')
const { getLogger } = require('./logging')

const UPDATED_AT_FIELD = 'updatedAt'
const STATE_REDIS_KEY_PREFIX = 'adapterCacheState'

const logger = getLogger('adapterCache')


class AdapterCacheMiddleware {

    constructor (config) {
        try {
            const parsedConfig = JSON.parse(config)

            this.enabled = !!get(parsedConfig, 'enable', false)

            // Cache: tableName -> queryKey -> { response, lastUpdate }
            this.cache = {}

            // Redis is used as State:
            // State: table_name -> lastUpdate
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

            // Debug mode allows to get full history of operations with cache including cache dumps.
            // Useful for local debugging
            // You shouldn't allow this on production as it will lead to memory leak!
            this.debugMode = !!get(parsedConfig, 'debug', false)
            this.cacheHistory = {}
            this.cacheCallHistory = []
            if (this.debugMode) {
                logger.warn(
                    'ADAPTER CACHE HAS DEBUG MODE TURNED ON. THIS WILL LEAD TO MEMORY LEAK ERRORS IN NON LOCAL ENVIRONMENT')
            }
        } catch (e) {
            this.enabled = false
            logger.warn(`ADAPTER_CACHE: Bad config! reason ${e}`)
        }
    }

    /**
     * Sometimes we might get a situation when two instances try to update state with different timestamp values.
     * So, we might have two commands ordered to execute by internal redis queue:
     * 1. SET some_key 18:00
     * 2. SET some_key 17:59
     * In result (GET some_key) will equal 17:59, but the correct value is 18:00!
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
     * Sets last updated table time to Redis storage
     * @param {string} key -- List name
     * @param {Date} value -- Last updated time
     * @returns {Promise<void>}
     */
    async setState (key, time) {
        const serializedTime = time.valueOf()
        const prefixedKey = `${STATE_REDIS_KEY_PREFIX}:${key}`
        await this.redisClient.cacheUpdateStateTimestamp(prefixedKey, serializedTime)
    }

    /**
     * Returns last updated time by table from Redis
     * @param {string} key -- List name
     * @returns {Promise<Date>}
     */
    async getState (key) {
        const serializedTime = await this.redisClient.get(`${STATE_REDIS_KEY_PREFIX}:${key}`)
        if (serializedTime) {
            const parsedTime = parseInt(serializedTime)
            if (!isNaN(parsedTime)) { return new Date(parsedTime) }
        }
        return null
    }

    writeChangeToHistory ({ cache, event, table }) {
        if (!this.debugMode) { return }
        if (!this.cacheHistory[table]) {
            this.cacheHistory[table] = []
        }
        const copiedCache = cloneDeep(cache)
        this.cacheHistory[table].push({
            cache: copiedCache,
            cacheByTable: copiedCache[table],
            type: event.type,
            event: event,
            dateTime: new Date().toLocaleString(),
            number: this.totalRequests,
        })
        this.cacheCallHistory.push({
            name: table,
            eventType: event.type,
            dateTime: new Date().toLocaleString(),
            number: cloneDeep(this.totalRequests),
        })
        this.cacheHistory.lastTableUpdated = table
    }

    getCacheEvent ({ type, key, table, result }) {
        return ({
            type: type,
            table: table,
            string: `
            🔴 STAT: ${this.cacheHits}/${this.totalRequests}\r\n
            🔴 RKEY: ${key}\r\n
            🔴 TYPE: ${type}\r\n
            🔴 RESP: ${result}\r\n
            `,
        })
    }

    logEvent ({ event }) {
        if (!this.logging) { return }
        logger.info(event.string)
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
 * @param {AdapterCacheMiddleware} middleware
 * @returns {Promise<void>}
 */
async function patchKeystoneAdapterWithCacheMiddleware (keystone, middleware) {
    const keystoneAdapter = keystone.adapter

    const cache = middleware.cache
    const includeAllLists = middleware.includeAllLists
    const excludedLists = middleware.excludedLists
    const includedLists = middleware.includedLists

    const listAdapters = Object.values(keystoneAdapter.listAdapters)

    for (const listAdapter of listAdapters) {

        const listName = listAdapter.key
        cache[listName] = {}

        const fields = listAdapter.fieldAdaptersByPath
        if (!fields[UPDATED_AT_FIELD] || !fields[UPDATED_AT_FIELD]) {
            logger.info(`ADAPTER_CACHE: Cache is NOT enabled for list: ${listName} -> No ${UPDATED_AT_FIELD} field`)
        }

        if (excludedLists.includes(listName) ||
            !includeAllLists && !includedLists.includes(listName)) {
            logger.info(`ADAPTER_CACHE: Cache is NOT enabled for list: ${listName} -> Cache is not included by config`)
            continue
        }

        logger.info(`ADAPTER_CACHE: Cache is enabled for list: ${listName}`)

        const originalItemsQuery = listAdapter._itemsQuery
        listAdapter._itemsQuery = async ( args, opts ) => {

            middleware.totalRequests++

            let key = null

            const argsJson = JSON.stringify(args)
            if (argsJson !== '{}') {
                key = listName + '_' + argsJson + '_' + stringifyComplexObj(opts)
            }

            let response = []
            const cached = key ? cache[listName][key] : false
            const tableLastUpdate = await middleware.getState(listName)

            if (cached) {
                const cacheLastUpdate = cached.lastUpdate
                if (cacheLastUpdate && cacheLastUpdate.getTime() === tableLastUpdate.getTime()) {
                    middleware.cacheHits++
                    const cacheEvent = middleware.getCacheEvent({
                        type: 'HIT',
                        table: listName,
                        key,
                        result: JSON.stringify(cached.response),
                    })
                    middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )
                    middleware.logEvent({ event: cacheEvent })
                    return cloneDeep(cached.response)
                }
            }

            response = await originalItemsQuery.apply(listAdapter, [args, opts] )

            let copiedResponse = cloneDeep(response)

            cache[listName][key] = {
                lastUpdate: tableLastUpdate,
                response: copiedResponse,
            }

            const cacheEvent = middleware.getCacheEvent({
                type: 'MISS',
                key,
                table: listName,
                result: JSON.stringify(copiedResponse),
            })
            middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )
            middleware.logEvent({ event: cacheEvent })

            return response
        }

        const originalUpdate = listAdapter.update
        listAdapter.update = patchAdapterFunction(listName, 'UPDATE', originalUpdate, listAdapter, middleware)

        const originalCreate = listAdapter.create
        listAdapter.create = patchAdapterFunction(listName, 'CREATE', originalCreate, listAdapter, middleware)

        const originalDelete = listAdapter.delete
        listAdapter.delete = patchAdapterFunction(listName, 'DELETE', originalDelete, listAdapter, middleware)
    }
}

/**
 * Patches a keystone mutation to add cache functionality
 * @param {string} listName
 * @param {string} functionName
 * @param {function} f
 * @param {{}} listAdapter
 * @param {AdapterCacheMiddleware} cache
 * @returns {function(...[*]): Promise<*>}
 */
function patchAdapterFunction ( listName, functionName, f, listAdapter, cache ) {
    return async ( ...args ) => {

        if (functionName === 'UPDATE') {
            console.log('HEY')
        }

        const functionResult = await f.apply(listAdapter, args)
        await cache.setState(listName, functionResult[UPDATED_AT_FIELD])

        if (cache.debugMode) {
            const cacheEvent = cache.getCacheEvent({ type: listName, table: listName })
            cache.writeChangeToHistory({ cache: cache.cache, event: cacheEvent, table: listName })
        }

        if (cache.logging) { logger.info(`${functionName}: ${functionResult}`) }

        return functionResult
    }
}

/**
 * Stringifies complex objects with circular dependencies
 * @param obj
 * @returns {string}
 */
function stringifyComplexObj (obj){
    const result = {}
    for (const prop in obj ){
        if (!obj.hasOwnProperty(prop)) { continue }
        if (typeof(obj[prop]) == 'object') { continue }
        if (typeof(obj[prop]) == 'function') { continue }
        result[prop] = obj[prop]
    }
    return JSON.stringify(result)
}

module.exports = {
    AdapterCacheMiddleware,
}