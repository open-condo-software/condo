/**
 * Keystone database adapter level cache
 *
 */

let totalRequests = 0
let cachedRequests = 0

const express = require('express')
const { get } = require('lodash')

class AdapterCacheMiddleware {
    cache = {}

    prepareMiddleware ({ keystone, dev, distDir }) {
        return express()
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

        console.log(`${cachedRequests}/${totalRequests}`)

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
    AdapterCacheMiddleware,
}
