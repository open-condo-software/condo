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

    async prepareMiddleware ({ keystone, dev, distDir }) {
        await initAdapterCache(keystone, this.cache, this.state)
    }
}

const UPDATED_AT = 'updatedAt'
const UPDATED_AT_SORT_BY = 'updatedAt_DESC'

const initAdapterCache = async (keystone, state, cache) => {
    const keystoneAdapter = keystone.adapter

    const listAdapters = Object.values(keystoneAdapter.listAdapters)

    for (const listAdapter of listAdapters) {

        const listName = listAdapter.key
        cache[listName] = {}

        const originalItemsQuery = listAdapter._itemsQuery
        listAdapter._itemsQuery = async ( args, opts ) => {
            
            totalRequests++

            const key = JSON.stringify(args) + '_' + JSON.stringify(get(opts, 'from.fromId', null))

            let response = []
            const cached = cache[listName][key]
            const tableLastUpdate = state[listName]

            if (cached) {
                const cacheLastUpdate = cached.lastUpdate
                if (cacheLastUpdate && cacheLastUpdate === tableLastUpdate) {
                    cacheHits++
                    console.log(`ADAPTER CACHE: ${cacheHits}/${totalRequests}`)
                    return cached.response
                }
            } 

            response = await originalItemsQuery.apply(listAdapter, [args, opts] )
            cache[listName][key] = {
                lastUpdate: tableLastUpdate,
                response: response,
            }

            console.log(`ADAPTER CACHE: ${cacheHits}/${totalRequests}`)
            return response
        }

        const originalUpdate = listAdapter._update
        listAdapter._update = async ( id, data ) => {
            const updateResult = await originalUpdate.apply(listAdapter, [id, data] )
            state[listName] = updateResult[UPDATED_AT]
            return updateResult
        }

        const originalCreate = listAdapter._create
        listAdapter._create = async ( data ) => {
            const createResult = await originalCreate.apply(listAdapter, [data] )
            state[listName] = createResult[UPDATED_AT]
            return createResult
        }

        const originalDelete = listAdapter._delete
        listAdapter._delete = async ( id ) => {
            const deleteResult = await originalDelete.apply(listAdapter, [id])
            state[listName] = deleteResult[UPDATED_AT]
            return deleteResult
        }
    }
}

module.exports = {
    AdapterCacheMiddleware,
}