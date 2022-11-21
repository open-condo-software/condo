/**
 * Keystone database adapter level cache
 *
 */

const { get, cloneDeep } = require('lodash')
const { getRedisClient } = require('./redis')

const UPDATED_AT = 'updatedAt'
const STATE_REDIS_KEY_PREFIX = 'adapterCacheState'

/**
 * TODO (toplenboren) (DOMA-2681) move this to auto detection algorithm or env!
 * These tables are connected between each other in a way, that changing one table is changing other table.
 * 1. Two way realtions
 * 2. MTM relations
 */
const ADAPTER_CACHE_CONNECTED_TABLES = {
    'MultiPayment':['Payment'],
    'Payment':['MultiPayment'],

    'AcquiringIntegration':['BillingIntegration'],
    'BillingIntegration':['AcquiringIntegration'],

    'Division': ['OrganizationEmployee', 'Property'],
    'OrganizationEmployee': ['Division', 'Property'],
    'Meter': ['Division', 'Property'],
    'Property': ['Division'],
}


class AdapterCacheMiddleware {

    constructor (config) {
        try {
            const parsedConfig = JSON.parse(config)

            this.enabled = !!get(parsedConfig, 'enable', false)

            // Cache: tableName -> queryKey -> { response, lastUpdate }
            this.cache = {}

            // Redis is used as State:
            // State: table_name -> lastUpdate
            this.redisClient = getRedisClient('adapterCacheState')

            // This mechanism allows to skip caching some tables.
            // Useful for hotfixes or disabling cache for business critical tables
            this.excludedTables = get(parsedConfig, 'excludedTables', [])

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
                console.warn('ADAPTER CACHE HAS DEBUG MODE TURNED ON. THIS WILL LEAD TO MEMORY LEAK ERRORS IN NON LOCAL ENVIRONMENT')
            }

            // This is just a hack that allows to drop state for more then one table for specific usecases.
            this.connectedTables = ADAPTER_CACHE_CONNECTED_TABLES

        }
        catch (e) {
            this.enabled = false
            console.warn(`ADAPTER_CACHE: Bad config! reason ${e}`)
        }
    }

    /**
     * Sets last updated table time to Redis storage
     * @param {string} key -- List name
     * @param {Date} value -- Last updated time
     * @returns {Promise<void>}
     */
    async setState (key, time) {
        const serializedTime = time.valueOf()
        await this.redisClient.set(`${STATE_REDIS_KEY_PREFIX}:${key}`, serializedTime)
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

    logEvent ({ event }) {
        if (!this.logging) { return }
        console.info(event.string)
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

    async prepareMiddleware ({ keystone, dev, distDir }) {
        if (this.enabled) {
            await patchKeystoneAdapterWithCacheMiddleware(keystone, this)
            console.info('ADAPTER_CACHE: Adapter level cache ENABLED')
        } else {
            console.info('ADAPTER_CACHE: Adapter level cache NOT ENABLED')
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
    const excludedTables = middleware.excludedTables

    const listAdapters = Object.values(keystoneAdapter.listAdapters)

    for (const listAdapter of listAdapters) {

        const listName = listAdapter.key
        cache[listName] = {}

        if (excludedTables.includes(listName)) {
            continue
        }

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
                if (cacheLastUpdate && cacheLastUpdate === tableLastUpdate) {
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

        const originalUpdate = listAdapter._update
        listAdapter._update = patchMutation(listName, 'UPDATE', originalUpdate, listAdapter, middleware)

        const originalCreate = listAdapter._create
        listAdapter._create = patchMutation(listName, 'CREATE', originalCreate, listAdapter, middleware)

        const originalDelete = listAdapter._delete
        listAdapter._delete = patchMutation(listName, 'DELETE', originalDelete, listAdapter, middleware)
    }
}

/**
 * Patches a keystone mutation to add cache functionality
 * @param {string} listName
 * @param {string} mutationName
 * @param {function} mutationFunc
 * @param {{}} listAdapter
 * @param {AdapterCacheMiddleware} middleware
 * @returns {function(...[*]): Promise<*>}
 */
function patchMutation ( listName, mutationName, mutationFunc, listAdapter, middleware ) {
    return async ( ...args ) => {
        const mutationResult = await mutationFunc.apply(listAdapter, args )
        await middleware.setState(listName, mutationResult[UPDATED_AT])

        if (listName in middleware.connectedTables) {
            for (const connectedTable of middleware.connectedTables[listName]) {
                await middleware.setState(connectedTable, mutationResult[UPDATED_AT])
            }
        }

        if (middleware.debugMode) {
            const cacheEvent = middleware.getCacheEvent({ type: listName, table: listName })
            middleware.writeChangeToHistory({ cache: middleware.cache, event: cacheEvent, table: listName })
        }

        if (middleware.logging) { console.info(`CREATE: ${mutationResult}`) }
        return mutationResult
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