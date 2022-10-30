/**
 * Keystone database adapter level cache
 *
 */

const { get } = require('lodash')

const UPDATED_AT = 'updatedAt'


function simpleStringify (object){
    // stringify an object, avoiding circular structures
    // https://stackoverflow.com/a/31557814
    const simpleObject = {}
    for (const prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue
        }
        if (typeof(object[prop]) == 'object'){
            continue
        }
        if (typeof(object[prop]) == 'function'){
            continue
        }
        simpleObject[prop] = object[prop]
    }
    return JSON.stringify(simpleObject) // returns cleaned up JSON
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
        this.cacheHistory[table].push({
            cache: JSON.parse(JSON.stringify(cache)),
            event: event,
            dateTime: new Date().toLocaleString(),
            number: this.totalRequests,
        })
        this.cacheHistory.lastTableUpdated = table
    }

    logEvent ({ event }) {
        if (!this.logging) { return }
        console.info(event)
    }

    getCacheEvent ({ type, key, result, stackTrace }) {
        return (
            `
        🔴 STAT: ${this.cacheHits}/${this.totalRequests}\r\n
        🔴 RKEY: ${key}\r\n
        🔴 TYPE: ${type}\r\n
        🔴 RESP: ${result}\r\n
        🔴 STCK ${stackTrace}`
            // 🔴 LCCH :: ${cache}\r\n
        )
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
                key = listName + '_' + JSON.stringify(args) + '_' + simpleStringify(opts)  // '_' + stackTrace
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
                        key,
                        stackTrace,
                        result: JSON.stringify(cached.response),
                    })
                    middleware.writeChangeToHistory({ cache, event: cacheEvent, table: listName } )
                    middleware.logEvent({ event: cacheEvent })
                    return cached.response
                }
            }

            response = await originalItemsQuery.apply(listAdapter, [args, opts] )

            let copiedResponse = response

            if (Array.isArray(response)) {
                const newResponse = []
                for (const obj of response) {
                    newResponse.push(Object.assign({}, obj))
                }
                copiedResponse = newResponse
            } else {
                copiedResponse = Object.assign({}, response)
            }

            cache[listName][key] = {
                lastUpdate: tableLastUpdate,
                response: copiedResponse,
            }

            const cacheEvent = middleware.getCacheEvent({
                type: 'MISS',
                key,
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
            if (logging) { console.info(`UPDATE: ${updateResult}`) }
            return updateResult
        }

        const originalCreate = listAdapter._create
        listAdapter._create = async ( data ) => {
            const createResult = await originalCreate.apply(listAdapter, [data] )
            state[listName] = createResult[UPDATED_AT]
            if (logging) { console.info(`CREATE: ${createResult}`) }
            return createResult
        }

        const originalDelete = listAdapter._delete
        listAdapter._delete = async ( id ) => {
            const deleteResult = await originalDelete.apply(listAdapter, [id])
            state[listName] = deleteResult[UPDATED_AT]
            if (logging) { console.info(`DELETE: ${deleteResult}`) }
            return deleteResult
        }
    }
}

module.exports = {
    AdapterCacheMiddleware,
}