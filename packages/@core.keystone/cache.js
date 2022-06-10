/**
 * Keystone-level cache.
 *
 * This package adds basic caching capabilities to keystone.
 *
 * Requirements:
 * 1. Every request should have x-request-id. If it doesn't have it -- this request will not use cache
 *
 * Installation:
 * 1. Have a custom keystone server
 * 2. Add a middleware KeystoneLevelCache(cache) before keystone AdminApp or GraphQL app
 *
 * How it works:
 *                           -> [GQL Request] -> [DB]
 * [HTTP Request] -> [Cache] -> [GQL Request] -> [DB]
 *                           -> [GQL Request] -> [DB]
 *
 * On every incoming request module simply checks x-request-id header and operation.
 * If request is `read` - return cache item (assuming cache has this item)
 * If request has other type - remove cache item by request id
 *
 * Cache structure:
 * cache: {
 *     <x-request-id>: {
 *      	<request-args>: []
 *      	<request-args>: []
 *      	<request-args>: []
 *     }
 * }
 *
 */

let totalRequests = 0
let cachedRequests = 0

const express = require('express')
const { get } = require('lodash')

class KeystoneCacheMiddleware {
    cache = {}

    prepareMiddleware ({ keystone, dev, distDir }) {

        // Add cache
        initCache(keystone, this.cache)

        // Add a middleware which resets cache after end of each request to avoid memory leak errors
        const app = express()
        app.use((req, res, next) => {
            const requestId = get(req, ['headers', 'x-request-id'])
            res.on('close', () => {
                if (requestId) { delete this.cache[requestId] }
            })
            next()
        })
        return app
    }
}

const generateRequestKey = (gqlName, args) => (
    `${gqlName}-${JSON.stringify(args)}`
)

const getRequestIdFromContext = (context) => {
    return get(context, ['req', 'headers', 'x-request-id'], null)
}

const patchMutation = (mutationContext, mutation, isUpdateMutation, cache) => {
    return async (data, context, mutationState) => {
        let requestId
        if (isUpdateMutation) {
            requestId = getRequestIdFromContext(mutationState)
        } else {
            requestId = getRequestIdFromContext(context)
        }
        if (requestId) { delete cache[requestId] }
        return await mutation.call(mutationContext, data, context,
            mutationState)
    }
}

const patchQuery = (queryContext, query, cache) => {
    return async function (args, context, gqlName, info, from) {
        let key = null
        const requestId = getRequestIdFromContext(context)

        totalRequests++

        if (requestId) {
            key = generateRequestKey(gqlName, args)

            if (!(requestId in cache)) {
                cache[requestId] = {}
            }

            // Drop the key, if the operation type is mutation
            const operationType = get(info, ['operation', 'operation'])
            if (operationType !== 'query') {
                delete cache[requestId][key]
            }

            if (key in cache[requestId]) {
                cachedRequests++
                return cache[requestId][key]
            }
        }
        const listResult = await query.call(queryContext, args, context, gqlName, info, from)

        if (requestId && key) { cache[requestId][key] = listResult }

        console.info(`X-REQUEST-ID CACHE: ${cachedRequests}/${totalRequests}`)

        return listResult
    }
}

const initCache = (keystone, cache) => {

    const originalCreateList = keystone.createList

    keystone.createList = async (...args) => {
        const list = originalCreateList.apply(keystone, args)

        list.createMutation = patchMutation(list, list.createMutation, false, cache)
        list.createManyMutation = patchMutation(list, list.createManyMutation, false, cache)

        list.updateMutation = patchMutation(list, list.updateMutation, true, cache)
        list.updateManyMutation = patchMutation(list, list.updateManyMutation, true, cache)

        list.deleteMutation = patchMutation(list, list.deleteMutation, true, cache)
        list.deleteManyMutation = patchMutation(list, list.deleteManyMutation, true, cache)

        list.listQuery = patchQuery(list, list.listQuery, cache)
        list.itemQuery = patchQuery(list, list.itemQuery, cache)

        return list
    }
}

module.exports = {
    KeystoneCacheMiddleware,
    initCache,
}

