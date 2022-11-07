/**
 * Keystone database adapter level cache
 *
 */

const { get, cloneDeep } = require('lodash')

const UPDATED_AT = 'updatedAt'

const CONNECTED_TABLES = {
    'MultiPayment':['Payment'],
    'Payment':['MultiPayment'],
    'AcquiringIntegration':['BillingIntegration'],
    'BillingIntegration':['AcquiringIntegration'],
    'Division':['OrganizationEmployee', 'Meter', 'Property'],
    'OrganizationEmployee':['Division', 'Property'],
    'Meter': ['Division', 'Property'],
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

function getCurrentStackTrace () {
    const err = new Error()
    return err.stack
}


class AdapterCacheMiddleware {

    // table_name -> queryKey -> { response, lastUpdate }
    cache = {}

    // Should be saved in Redis! Here only for demonstration purposes!
    // table_name -> lastUpdate (of this table)
    state = {}

    constructor (config) {
        try {
            const parsedConfig = JSON.parse(config)
            this.enabled = !!get(parsedConfig, 'enable', false)
            this.redisUrl = get(parsedConfig, 'redisUrl')
            this.excludedTables = get(parsedConfig, 'excludedTables', [])
            this.logging = get(parsedConfig, 'logging', false)
            this.debugMode = !!get(parsedConfig, 'debug', false)
            this.cacheHistory = {}
            this.cacheCallHistory = []
            this.totalRequests = 0
            this.cacheHits = 0

            if (this.debugMode) {
                console.warn('ADAPTER CACHE HAS DEBUG MODE TURNED ON. THIS WILL LEAD TO MEMORY LEAK ERRORS IN NON_LOCAL ENVIRONMENT, OR WITH RUNNING BIG TESTSUITES')
            }

        }
        catch (e) {
            this.enabled = false
            console.warn(`ADAPTER_CACHE: Bad config! reason ${e}`)
        }
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

    getCacheEvent ({ type, key, table, result, stackTrace }) {
        return ({
            type: type,
            table: table,
            string: `
            🔴 STAT: ${this.cacheHits}/${this.totalRequests}\r\n
            🔴 RKEY: ${key}\r\n
            🔴 TYPE: ${type}\r\n
            🔴 RESP: ${result}\r\n
            🔴 STCK ${stackTrace}`,
        })
    }

    async prepareMiddleware ({ keystone, dev, distDir }) {
        if (this.enabled) {
            await initAdapterCache(keystone, this)
            console.info('ADAPTER_CACHE: Adapter level cache ENABLED')
        } else {
            console.info('ADAPTER_CACHE: Adapter level cache NOT ENABLED')
        }
    }
}



const initAdapterCache = async (keystone, middleware) => {
    const keystoneAdapter = keystone.adapter

    const cache = middleware.cache
    const state = middleware.state
    const logging = middleware.logging
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
            const stackTrace = getCurrentStackTrace()

            let key = null

            const argsJson = JSON.stringify(args)

            if (argsJson !== '{}') {
                key = listName + '_' + JSON.stringify(args) + '_' + stringifyComplexObj(opts)  // '_' + stackTrace
            }

            let response = []
            const cached = cache[listName][key]
            const tableLastUpdate = state[listName]

            if (cached) {
                const cacheLastUpdate = cached.lastUpdate
                if (cacheLastUpdate && cacheLastUpdate === tableLastUpdate) {
                    middleware.cacheHits++
                    const cacheEvent = middleware.getCacheEvent({
                        type: 'HIT',
                        table: listName,
                        key,
                        stackTrace,
                        result: JSON.stringify(cached.response),
                    })
                    middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )
                    middleware.logEvent({ event: cacheEvent })
                    return cloneDeep(cached.response)
                }
            }

            response = await originalItemsQuery.apply(listAdapter, [args, opts] )

            let copiedResponse = cloneDeep(response)
            if (listName === 'BillingReceipt' && Array.isArray(response)) {
                for (let i = 0; i < response.length; ++i) {
                    if (response.period) {
                        copiedResponse.period = new Date(response.period.getTime())
                    }
                }
            }

            cache[listName][key] = {
                lastUpdate: tableLastUpdate,
                response: copiedResponse,
            }

            const cacheEvent = middleware.getCacheEvent({
                type: 'MISS',
                key,
                table: listName,
                stackTrace,
                result: JSON.stringify(copiedResponse),
            })
            middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )
            middleware.logEvent({ event: cacheEvent })

            return response
        }

        const originalUpdate = listAdapter._update
        listAdapter._update = async ( id, data ) => {
            const updateResult = await originalUpdate.apply(listAdapter, [id, data] )
            state[listName] = updateResult[UPDATED_AT]

            if (listName in CONNECTED_TABLES) {
                for (const connectedTable of CONNECTED_TABLES[listName]) {
                    state[connectedTable] = updateResult[UPDATED_AT]
                }
            }

            const cacheEvent = middleware.getCacheEvent({
                type: 'UPDATE',
                table: listName,
            })
            middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )

            if (logging) { console.info(`UPDATE: ${updateResult}`) }
            return updateResult
        }

        const originalCreate = listAdapter._create
        listAdapter._create = async ( data ) => {
            const createResult = await originalCreate.apply(listAdapter, [data] )
            state[listName] = createResult[UPDATED_AT]

            if (listName in CONNECTED_TABLES) {
                for (const connectedTable of CONNECTED_TABLES[listName]) {
                    state[connectedTable] = createResult[UPDATED_AT]
                }
            }

            const cacheEvent = middleware.getCacheEvent({
                type: 'CREATE',
                table: listName,
            })
            middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )

            if (logging) { console.info(`CREATE: ${createResult}`) }
            return createResult
        }

        const originalDelete = listAdapter._delete
        listAdapter._delete = async ( id ) => {
            const deleteResult = await originalDelete.apply(listAdapter, [id])
            state[listName] = deleteResult[UPDATED_AT]

            const cacheEvent = middleware.getCacheEvent({
                type: 'DELETE',
                table: listName,
            })

            if (listName in CONNECTED_TABLES) {
                for (const connectedTable of CONNECTED_TABLES[listName]) {
                    state[connectedTable] = deleteResult[UPDATED_AT]
                }
            }

            middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )

            if (logging) { console.info(`DELETE: ${deleteResult}`) }
            return deleteResult
        }
    }
}

module.exports = {
    AdapterCacheMiddleware,
}