/**
 * Keystone database adapter level cache
 *
 */

const express = require('express')
const { get } = require('lodash')

let totalRequests = 0
let cacheHits = 0

class AdapterCacheMiddleware {

    // table_name -> queryKey -> { response, lastUpdate}
    cache = {}

    // Should be saved in Redis!
    // table_name -> lastUpdate (of this table)
    state = {}

    prepareMiddleware ({ keystone, dev, distDir }) {
        initAdapterCache(keystone, this.cache, this.state)
    }
}

const UPDATED_AT = 'updatedAt'

const initAdapterCache = (keystone, state, cache) => {
    const adapter = keystone.adapter

    const listAdapters = Object.values(adapter.listAdapters)
    listAdapters.forEach(adapter => {

        const listName = adapter.key
        state[listName] = ''
        cache[listName] = {}

        const originalItemsQuery = adapter._itemsQuery
        adapter._itemsQuery = async ( args, opts ) => {
            
            totalRequests++
            
            const key = JSON.stringify(args)

            let response = undefined
            const cached = cache[listName][key]
            const tableLastUpdate = state[listName]

            if (cached) {
                const cacheLastUpdate = cached.lastUpdate
                if (cacheLastUpdate === tableLastUpdate && tableLastUpdate !== '') {
                    cacheHits++
                    console.log(`ADAPTER CACHE: ${cacheHits}/${totalRequests}`)
                    return cache.response
                }
            } 

            response = await originalItemsQuery.apply(adapter, [args, opts] )
            cache[listName][key] = {
                lastUpdate: tableLastUpdate,
                response: response,
            }

            console.log(`ADAPTER CACHE: ${cacheHits}/${totalRequests}`)
            return response
        }

        const originalUpdate = adapter._update
        adapter._update = async ( id, data ) => {
            const updateResult = await originalUpdate.apply(adapter, [id, data] )
            state[listName] = updateResult[UPDATED_AT]
            return updateResult
        }

        const originalCreate = adapter._create
        adapter._create = async ( data ) => {
            const createResult = await originalCreate.apply(adapter, [data] )
            state[listName] = createResult[UPDATED_AT]
            return createResult
        }

        // const originalDelete = adapter._delete
        // adapter._delete = async ( id ) => {
        //     const x = 20
        //     return await originalDelete.apply(adapter, [id])
        // }
    })
}

module.exports = {
    AdapterCacheMiddleware,
}