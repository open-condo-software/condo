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
const Metrics = require('./metrics')

const REQUEST_CACHE_METRIC_PREFIX = 'requestCache'
const REQUEST_CACHE_HITRATE_METRIC_NAME = REQUEST_CACHE_METRIC_PREFIX + '.hitrate'
const REQUEST_CACHE_TOTAL_METRIC_NAME = REQUEST_CACHE_METRIC_PREFIX + '.total'
const REQUEST_CACHE_HITS_METRIC_NAME = REQUEST_CACHE_METRIC_PREFIX + '.hits'

const logger = getLogger('request-cache')

class RequestCache {

    constructor ({ enabled, logging, logStatsEachSecs }) {
        this.cache = {}

        this.enabled = !!enabled
        this.logging = !!logging

        this.logStatsEachSecs = logStatsEachSecs || 60
        this.totalRequests = 0
        this.cacheHits = 0
        if (this.enabled) this.statsInterval = setInterval(() => this._logStats(), this.logStatsEachSecs * 1000)
        if (this.enabled) this.metricsInterval = setInterval(() => this._logMetrics(), 1000)
    }

    // Add a middleware which resets cache after end of each request to avoid memory leak errors
    prepareMiddleware ({ keystone }) {
        // just a middleware that going to work along with keystone security policies
        // not a part of csrf since not exposing any routes
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        if (this.enabled) {
            patchKeystoneWithRequestCache(keystone, this)

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

    logEvent ({ type, functionName, listName, key, result }) {
        if (!this.logging) return

        logger.info({
            msg: 'request cache event',
            type,
            listKey: listName,
            functionName,
            data: {
                key,
                result,
            },
        })
    }

    _getHitrate = () => {
        if (this.totalRequests !== 0) {
            return this.cacheHits / this.totalRequests
        } else {
            return 0
        }
    }

    _logMetrics = () => {
        Metrics.gauge({ name: REQUEST_CACHE_HITS_METRIC_NAME, value: this.cacheHits })
        Metrics.gauge({ name: REQUEST_CACHE_TOTAL_METRIC_NAME, value: this.totalRequests })
        Metrics.gauge({ name: REQUEST_CACHE_HITRATE_METRIC_NAME, value: this._getHitrate() })
    }

    _logStats = () => {
        logger.info({
            msg: 'request cache stats',
            data: {
                stats: {
                    hits: this.cacheHits,
                    total: this.totalRequests,
                    hitrate: floor(this._getHitrate(), 2),
                },
            },
        })
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

const getMutationFunctionWithCache = (mutationContext, mutation, isUpdateMutation, requestCache) => {
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

const getQueryFunctionWithCache = (queryContext, query, requestCache) => {
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
    keystone.listsArray.map((list) => {
        const patchedList = list

        patchedList.createMutation = getMutationFunctionWithCache(list, list.createMutation, false, requestCache)
        patchedList.createManyMutation = getMutationFunctionWithCache(list, list.createManyMutation, false, requestCache)

        patchedList.updateMutation = getMutationFunctionWithCache(list, list.updateMutation, true, requestCache)
        patchedList.updateManyMutation = getMutationFunctionWithCache(list, list.updateManyMutation, true, requestCache)

        patchedList.deleteMutation = getMutationFunctionWithCache(list, list.deleteMutation, true, requestCache)
        patchedList.deleteManyMutation = getMutationFunctionWithCache(list, list.deleteManyMutation, true, requestCache)

        patchedList.listQuery = getQueryFunctionWithCache(list, list.listQuery, requestCache)
        patchedList.itemQuery = getQueryFunctionWithCache(list, list.itemQuery, requestCache)

        return patchedList
    })
}

module.exports = {
    RequestCache,
}

