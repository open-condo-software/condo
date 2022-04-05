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
 * 2. Somewhere in index.js call initCache(keystone, cache)
 * 3. Add a middleware KeystoneLevelCache(cache) before keystone AdminApp or GraphQL app
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

const express = require('express')
const { get } = require('lodash')

class KeystoneCacheMiddleware {

    constructor (cache) {
        if (!(typeof cache === 'object') || cache === null) {
            throw new Error('Cache should be dict!')
        }
        this.cache = cache
    }

    prepareMiddleware ({ keystone, dev, distDir }) {

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

const initCache = (keystone, cache) => {

    const originalCreateList = keystone.createList

    console.debug('INITIATING KEYSTONE-LEVEL-CACHE')

    const generateRequestKey = (gqlName, args) => (
        `${gqlName}-${JSON.stringify(args)}`
    )

    const getRequestIdFromContext = (context) => {
        return get(context, ['req', 'headers', 'x-request-id'], null)
    }

    keystone.createList = async (...args) => {
        const list = originalCreateList.apply(keystone, args)

        // Ensure that if there is a mutation -- we delete cache item!
        const originalCreateMutation = list.createMutation
        list.createMutation = async ( data, context, mutationState ) => {
            const requestId = getRequestIdFromContext(context)
            if (requestId) { delete cache[requestId] }
            return await originalCreateMutation.call( list, data, context, mutationState )
        }

        const originalCreateManyMutation = list.createManyMutation
        list.createManyMutation = async ( data, context, mutationState ) => {
            const requestId = getRequestIdFromContext(context)
            if (requestId) { delete cache[requestId] }
            return await originalCreateManyMutation.call( list, data, context, mutationState )
        }

        // For some reason mutationState == context in case of update. Ask Keystone!
        const originalUpdateMutation = list.updateMutation
        list.updateMutation = async ( data, context, mutationState ) => {
            const requestId = getRequestIdFromContext(mutationState)
            if (requestId) { delete cache[requestId] }
            return await originalUpdateMutation.call( list, data, context, mutationState )
        }

        const originalUpdateManyMutation = list.updateManyMutation
        list.updateManyMutation = async ( data, context, mutationState ) => {
            const requestId = getRequestIdFromContext(mutationState)
            if (requestId) { delete cache[requestId] }
            return await originalUpdateManyMutation.call( list, data, context, mutationState )
        }

        const originalDeleteMutation = list.deleteMutation
        list.deleteMutation = async ( data, context, mutationState ) => {
            const requestId = getRequestIdFromContext(mutationState)
            if (requestId) { delete cache[requestId] }
            return await originalDeleteMutation.call( list, data, context, mutationState )
        }

        const originalListQuery = list.listQuery
        list.listQuery = async function (args, context, gqlName, info, from) {

            let key = null
            const requestId = getRequestIdFromContext(context)

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
                    return cache[requestId][key]
                }
            }

            const listResult = await originalListQuery.call(list, args, context, gqlName, info, from)

            if (requestId && key) { cache[requestId][key] = listResult }

            return listResult
        }

        const originalItemQuery = list.itemQuery
        list.itemQuery = async (args, context, gqlName, info, from) => {

            let key = null
            const requestId = getRequestIdFromContext(context)

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
                    return cache[requestId][key]
                }
            }

            const itemQuery = await originalItemQuery.call(list, args, context, gqlName, info, from)

            if (requestId && key) { cache[requestId][key] = itemQuery }

            return itemQuery
        }

        return list
    }
}

module.exports = {
    KeystoneCacheMiddleware,
    initCache,
}

