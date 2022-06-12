/**
 * Keystone database adapter level cache
 *
 */

const { get } = require('lodash')

let totalRequests = 0
let cacheHits = 0

class AdapterCacheMiddleware {

    constructor (config) {
        try {
            const parsedConfig = JSON.parse(config)
            this.enabled = get(parsedConfig, 'enable', false)
            this.redisUrl = get(parsedConfig, 'redis_url')
            this.excludedTables = get(parsedConfig, 'excluded_tables', [])
            this.logging = get(parsedConfig, 'logging', false)
        }
        catch (e) {
            this.enabled = false
            console.warn(`UNABLE TO ENABLE CACHE, reason ${e}`)
        }
    }

    // table_name -> queryKey -> { response, lastUpdate}
    cache = {}

    // Should be saved in Redis!
    // table_name -> lastUpdate (of this table)
    state = {}

    async prepareMiddleware ({ keystone, dev, distDir }) {
        if (this.enabled) {
            await initAdapterCache(keystone, this.cache, this.state, this.logging, this.excludedTables, this.redisUrl)
        }
    }
}

const UPDATED_AT = 'updatedAt'

const initAdapterCache = async (keystone, state, cache, logging, excludedTables, redisUrl) => {
    const keystoneAdapter = keystone.adapter

    const listAdapters = Object.values(keystoneAdapter.listAdapters)

    for (const listAdapter of listAdapters) {

        const listName = listAdapter.key
        cache[listName] = {}

        if (excludedTables.includes(listName)) {
            continue
        }

        const originalItemsQuery = listAdapter._itemsQuery
        listAdapter._itemsQuery = async ( args, opts ) => {

            totalRequests++

            const key = JSON.stringify(args) + '_' + get(opts, 'from.fromId', null) + '_' + get(opts, 'from.fromField' )

            let response = []
            const cached = cache[listName][key]
            const tableLastUpdate = state[listName]

            if (cached) {
                const cacheLastUpdate = cached.lastUpdate
                if (cacheLastUpdate && cacheLastUpdate === tableLastUpdate) {
                    cacheHits++
                    if (logging) { console.info(`ADAPTER CACHE: ${cacheHits}/${totalRequests} :: KEY: ${key} :: HIT :: ${JSON.stringify(cached.response)}`) }
                    return cached.response
                }
            }

            response = await originalItemsQuery.apply(listAdapter, [args, opts] )
            cache[listName][key] = {
                lastUpdate: tableLastUpdate,
                response: response,
            }

            if (logging) { console.info(`ADAPTER CACHE: ${cacheHits}/${totalRequests} :: KEY: ${key} :: MISS :: ${JSON.stringify(response)}`) }
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