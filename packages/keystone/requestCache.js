/**
 * Keystone-level cache.
 *
 * This package adds basic caching capabilities to keystone.
 *
 * Requirements:
 * 1. Every request should have x-request-id. If it doesn't have it -- this request will not use cache
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
const { get, set, floor } = require('lodash')

const { getLogger } = require('./logging')

const logger = getLogger('request-cache')

class RequestCache {

    constructor (keystone, { enabled, logging, logStatsEachSecs }) {
        this.cache = {}

        this.enabled = !!enabled
        this.logging = !!logging

        this.logStatsEachSecs = logStatsEachSecs || 60
        this.totalRequests = 0
        this.cacheHits = 0
        this.statsInterval = setInterval(() => this._logStats(), this.logStatsEachSecs * 100)

        if (this.enabled) { patchKeystoneWithRequestCache(keystone, this) }
    }

    prepareMiddleware () {
        // Add a middleware which resets cache after end of each request to avoid memory leak errors
        const app = express()
        if (this.enabled) {
            app.use((req, res, next) => {
                const requestId = get(req, ['headers', 'x-request-id'])
                res.on('close', () => {
                    if (requestId) {
                        this.logEvent({ type: 'DROP', functionName: 'REQUEST_END', key: requestId })
                        delete this.cache[requestId]
                    }
                })
                next()
            })
        }
        return app
    }

    incrementHit () {
        return this.cacheHits++
    }

    incrementTotal () {
        return this.totalRequests++
    }

    _logStats = () => {
        logger.info({ stats:{
            hits: this.cacheHits,
            total: this.totalRequests,
            hitrate: floor(this.cacheHits / this.totalRequests, 2),
        } }
        )
    }

    logEvent ( { type, functionName, listName, key, result } ) {
        if (!this.logging) return

        const cacheEvent = {
            type,
            functionName,
            listName,
            key,
            result,
        }

        logger.info(cacheEvent)
    }
}

const generateRequestKey = (gqlName, args, fromId) => {
    let key = `${gqlName}-${JSON.stringify(args)}`

    if (fromId) {
        key += `-${fromId}`
    }

    return key
}

const getRequestIdFromContext = (context) => {
    return get(context, ['req', 'headers', 'x-request-id'], null)
}

const patchMutation = (mutationContext, mutation, isUpdateMutation, requestCache) => {
    return async (data, context, mutationState) => {
        let requestId
        if (isUpdateMutation) {
            requestId = getRequestIdFromContext(mutationState)
        } else {
            requestId = getRequestIdFromContext(context)
        }
        if (requestId) { delete requestCache.cache[requestId] }
        return await mutation.call(mutationContext, data, context, mutationState)
    }
}

const patchQuery = (queryContext, query, requestCache) => {
    return async function (args, context, gqlName, info, from) {
        requestCache.incrementTotal()

        let key = null
        const requestId = getRequestIdFromContext(context)

        if (requestId) {
            const fromId = get(from, 'fromId')
            key = generateRequestKey(gqlName, args, fromId)

            if (!(requestId in requestCache.cache)) {
                requestCache.cache[requestId] = {}
            }

            // Drop the key, if the operation type is mutation
            const operationType = get(info, ['operation', 'operation'])
            if (operationType !== 'query' && get(requestCache.cache, [requestId, key])) {
                requestCache.logEvent({ type: 'DROP', functionName: 'DELETE', key: `${requestId}->${key}` })
                delete requestCache.cache[requestId][key]
            }

            if (key in requestCache.cache[requestId]) {
                requestCache.incrementHit()

                requestCache.logEvent({ type: 'HIT', functionName: 'QUERY', key })

                return await requestCache.cache[requestId][key]
            }
        } else {
            requestCache.logEvent({ type: 'NO_REQUEST_ID', functionName: 'QUERY', key })
        }

        requestCache.logEvent({ type: 'MISS', functionName: 'QUERY', key })
        const listResultPromise = query.call(queryContext, args, context, gqlName, info, from)

        if (requestId && key) {
            set(requestCache.cache, [requestId, key], listResultPromise)
            requestCache.logEvent({ type: 'SET', functionName: 'QUERY', key })
        }

        return await listResultPromise
    }
}

const patchKeystoneWithRequestCache = (keystone, requestCache) => {

    const originalCreateList = keystone.createList

    keystone.createList = async (...args) => {
        const list = originalCreateList.apply(keystone, args)

        list.createMutation = patchMutation(list, list.createMutation, false, requestCache)
        list.createManyMutation = patchMutation(list, list.createManyMutation, false, requestCache)

        list.updateMutation = patchMutation(list, list.updateMutation, true, requestCache)
        list.updateManyMutation = patchMutation(list, list.updateManyMutation, true, requestCache)

        list.deleteMutation = patchMutation(list, list.deleteMutation, true, requestCache)
        list.deleteManyMutation = patchMutation(list, list.deleteManyMutation, true, requestCache)

        list.listQuery = patchQuery(list, list.listQuery, requestCache)
        list.itemQuery = patchQuery(list, list.itemQuery, requestCache)

        return list
    }
}

module.exports = {
    RequestCache,
}

