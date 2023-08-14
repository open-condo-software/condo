const { get } = require('lodash')


const DELIMETER = ':'
const MUTATION_QUERY_REGEX = /(?:mutation|query)\s+(\w+)/


function getTracedQueryFunction (tracer, config, ctx, f) {
    const { name, listKey } = config

    return async function (args, context, gqlName, info, from) {
        return tracer.startActiveSpan(name + DELIMETER + listKey, async (span) => {
            span.setAttribute('type', 'query')

            span.setAttribute('listKey', listKey)
            span.setAttribute('functionName', name)

            span.setAttribute('gqlName', gqlName)
            span.setAttribute('args', args)

            const listResult = await f.call(ctx, args, context, gqlName, info, from)
            span.end()
            return listResult
        })
    }
}


function getTracedMutationFunction (tracer, config, ctx, f) {
    const { name, listKey } = config

    return async function (data, context, mutationState) {
        return tracer.startActiveSpan(name + DELIMETER + listKey, async (span) => {
            span.setAttribute('type', 'mutation')

            span.setAttribute('listKey', listKey)

            const result = await f.call(ctx, data, context, mutationState)
            span.end()
            return result
        })
    }
}


const patchKeystoneGraphQLExecutor = (tracer, keystone) => {
    const originalExecuteGraphQL = keystone.executeGraphQL
    keystone.executeGraphQL = ({ context, query, variables }) => {
        let queryName = undefined
        if (typeof query === 'string') {
            const matches = query.match(MUTATION_QUERY_REGEX)
            if (matches && matches[1])
                queryName = matches[1]
        } else {
            queryName = get(query, ['definitions', 0, 'name', 'value'])
        }

        return tracer.startActiveSpan('gql' + DELIMETER + queryName, async (span) => {
            span.setAttribute('queryName', queryName)

            const result = originalExecuteGraphQL.call(keystone, { context, query, variables })
            span.end()
            return result
        })
    }
}


const patchKeystoneList = (tracer, keystone) => {
    keystone.listsArray.map((list) => {
        const patchedList = list

        const listKey = list.key

        patchedList.createMutation = getTracedMutationFunction(tracer, { listKey, name: 'createMutation' }, list, list.createMutation)
        patchedList.createManyMutation = getTracedMutationFunction(tracer, { listKey, name: 'createManyMutation' }, list, list.createManyMutation)

        patchedList.updateMutation = getTracedMutationFunction(tracer, { listKey, name: 'updateMutation' }, list, list.updateMutation)
        patchedList.updateManyMutation = getTracedMutationFunction(tracer, { listKey, name: 'updateManyMutation' }, list, list.updateManyMutation)

        // Todo add delete mutations
        // patchedList.deleteMutation = getMutationFunctionWithCache(list, list.deleteMutation, true, requestCache)
        // patchedList.deleteManyMutation = getMutationFunctionWithCache(list, list.deleteManyMutation, true, requestCache)

        patchedList.listQuery = getTracedQueryFunction(tracer, { listKey, name: 'listQuery' }, list, list.listQuery)
        patchedList.itemQuery = getTracedQueryFunction(tracer, { listKey, name: 'itemQuery' }, list, list.itemQuery)

        return patchedList
    })
}


const getTracedAdapterFunction = (tracer, config, ctx, f) => {
    const { name, listKey } = config

    return async function (...args) {
        return tracer.startActiveSpan(name + DELIMETER + listKey, async (span) => {
            span.setAttribute('type', 'adapter')

            span.setAttribute('listKey', listKey)
            span.setAttribute('functionName', name)

            const res = await f.call(ctx, ...args)
            span.end()
            return res
        })
    }
}


const patchKeystoneAdapter = (tracer, keystone) => {
    for (const listAdapter of Object.values(get(keystone, ['adapter', 'listAdapters']))) {
        const originalListAdapter = listAdapter
        const listKey = listAdapter.key

        listAdapter.find = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:find' }, listAdapter, originalListAdapter.find)
        listAdapter.findOne = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:findOne' }, listAdapter, originalListAdapter.findOne)
        listAdapter.findById = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:findById' }, listAdapter, originalListAdapter.findById)
        listAdapter.itemsQuery = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:itemsQuery' }, listAdapter, originalListAdapter.itemsQuery)

        listAdapter.create = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:create' }, listAdapter, originalListAdapter.create)
        listAdapter.delete = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:delete' }, listAdapter, originalListAdapter.delete)
        listAdapter.update = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:update' }, listAdapter, originalListAdapter.update)

        listAdapter.createMany = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.createMany)
        listAdapter.deleteMany = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.deleteMany)
        listAdapter.updateMany = getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.updateMany)
    }
}

const patchKeystone = (tracer, keystone) => {
    patchKeystoneGraphQLExecutor(tracer, keystone)
    patchKeystoneList(tracer, keystone)
    patchKeystoneAdapter(tracer, keystone)
}

module.exports = {
    patchKeystone,
}