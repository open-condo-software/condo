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
const { get, set } = require('lodash')

const conf = require('@condo/config')

const { getLogger } = require('./logging')

const logger = getLogger('cache-l1')

const ENABLE_CACHE_LOGGING = !!conf.ENABLE_CACHE_LOGGING


class KeystoneCacheMiddleware {

    constructor (keystone) {
        this.cache = {}

        this.hits = 0
        this.requests = 0
        this.hasRequestId = 0

        initCache(keystone, this)
    }

    prepareMiddleware () {
        // Add a middleware which resets cache after end of each request to avoid memory leak errors
        const app = express()
        app.use((req, res, next) => {
            const requestId = get(req, ['headers', 'x-request-id'])
            res.on('close', () => {
                if (requestId) {

                    if (ENABLE_CACHE_LOGGING) {
                        logger.info(`DELETE_FROM_MIDDLEWARE: ${requestId}`)
                    }

                    delete this.cache[requestId]
                }
            })
            next()
        })
        return app
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

const patchMutation = (mutationContext, mutation, isUpdateMutation, cacheMiddleware) => {
    return async (data, context, mutationState) => {
        let requestId
        if (isUpdateMutation) {
            requestId = getRequestIdFromContext(mutationState)
        } else {
            requestId = getRequestIdFromContext(context)
        }
        if (requestId) { delete cacheMiddleware.cache[requestId] }
        return await mutation.call(mutationContext, data, context, mutationState)
    }
}

const patchQuery = (queryContext, query, cacheMiddleware) => {
    return async function (args, context, gqlName, info, from) {
        cacheMiddleware.requests++

        let key = null
        const requestId = getRequestIdFromContext(context)

        if (requestId) {
            cacheMiddleware.hasRequestId++

            const fromId = get(from, 'fromId')
            key = generateRequestKey(gqlName, args, fromId)

            if (!(requestId in cacheMiddleware.cache)) {
                cacheMiddleware.cache[requestId] = {}
            }

            // Drop the key, if the operation type is mutation
            const operationType = get(info, ['operation', 'operation'])
            if ((operationType !== 'query') && get(cacheMiddleware.cache, [requestId, key])) {

                if (ENABLE_CACHE_LOGGING) {
                    logger.info(`DELETE: ${requestId}\r\n${gqlName} ${JSON.stringify(args)}`)
                }

                delete cacheMiddleware.cache[requestId][key]
            }

            if (key in cacheMiddleware.cache[requestId]) {
                cacheMiddleware.hits++

                if (ENABLE_CACHE_LOGGING) {
                    logger.info(`HIT: ${requestId}\r\n${gqlName} ${JSON.stringify(args)}\r\nScore: ${cacheMiddleware.hits}/${cacheMiddleware.requests} Request ids: ${cacheMiddleware.hasRequestId}/${requestId} `)
                }

                return await cacheMiddleware.cache[requestId][key]
            }
        } else {
            if (ENABLE_CACHE_LOGGING) {
                logger.info(`WARNING: No request ID\r\n${gqlName} ${JSON.stringify(args)}`)
            }
        }

        if (ENABLE_CACHE_LOGGING) {
            logger.info(`MISS: ${requestId}\r\n${gqlName} ${JSON.stringify(args)}\r\nScore: ${cacheMiddleware.hits}/${cacheMiddleware.requests} Request ids: ${cacheMiddleware.hasRequestId}/${cacheMiddleware.requests}`)
        }

        const listResultPromise = query.call(queryContext, args, context, gqlName, info, from)

        if (requestId && key) {
            set(cacheMiddleware.cache, [requestId, key], listResultPromise)

            if (ENABLE_CACHE_LOGGING) {
                logger.info( `SET: ${requestId}\r\n${gqlName} ${JSON.stringify(args)}` )
            }
        }

        return await listResultPromise
    }
}

const initCache = (keystone, cacheMiddleware) => {

    const originalCreateList = keystone.createList

    keystone.createList = async (...args) => {
        const list = originalCreateList.apply(keystone, args)

        list.createMutation = patchMutation(list, list.createMutation, false, cacheMiddleware)
        list.createManyMutation = patchMutation(list, list.createManyMutation, false, cacheMiddleware)

        list.updateMutation = patchMutation(list, list.updateMutation, true, cacheMiddleware)
        list.updateManyMutation = patchMutation(list, list.updateManyMutation, true, cacheMiddleware)

        list.deleteMutation = patchMutation(list, list.deleteMutation, true, cacheMiddleware)
        list.deleteManyMutation = patchMutation(list, list.deleteManyMutation, true, cacheMiddleware)

        list.listQuery = patchQuery(list, list.listQuery, cacheMiddleware)
        list.itemQuery = patchQuery(list, list.itemQuery, cacheMiddleware)

        return list
    }
}

module.exports = {
    KeystoneCacheMiddleware,
}

