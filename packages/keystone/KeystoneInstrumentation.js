const { get } = require('lodash')

const DELIMETER = ':'
const MUTATION_QUERY_REGEX = /(?:mutation|query)\s+(\w+)/


const _getTracedFunction = ({ name, spanHook, tracer, ctx, f }) => {

    return async function (...args) {

        // Sometimes you want the name of the trace to be calculated in runtime
        const parsedName = typeof name === 'function' ? name(...args) : name

        return tracer.startActiveSpan(parsedName, async (span) => {
            spanHook(span, ...args)

            const res = await f.call(ctx, ...args)
            span.end()
            return res
        })
    }
}


function _getTracedQueryFunction (tracer, config, ctx, f) {
    const { name, listKey } = config
    return _getTracedFunction({
        name: name + DELIMETER + listKey,
        spanHook: (span, _) => {
            span.setAttribute('type', 'query')
            span.setAttribute('listKey', listKey)
            span.setAttribute('functionName', name)
        },
        ctx, f, tracer,
    })
}


function _getTracedMutationFunction (tracer, config, ctx, f) {
    const { name, listKey } = config
    return _getTracedFunction({
        name: name + DELIMETER + listKey,
        spanHook: (span, _) => {
            span.setAttribute('type', 'mutation')
            span.setAttribute('listKey', listKey)
        },
        ctx, f, tracer,
    })
}

const _patchKeystoneGraphQLExecutor = (tracer, keystone) => {
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


const _patchKeystoneList = (tracer, keystone) => {
    keystone.listsArray.map((list) => {
        const patchedList = list

        const listKey = list.key

        patchedList.createMutation = _getTracedMutationFunction(tracer, { listKey, name: 'createMutation' }, list, list.createMutation)
        patchedList.createManyMutation = _getTracedMutationFunction(tracer, { listKey, name: 'createManyMutation' }, list, list.createManyMutation)

        patchedList.updateMutation = _getTracedMutationFunction(tracer, { listKey, name: 'updateMutation' }, list, list.updateMutation)
        patchedList.updateManyMutation = _getTracedMutationFunction(tracer, { listKey, name: 'updateManyMutation' }, list, list.updateManyMutation)

        patchedList.deleteMutation = _getTracedMutationFunction(tracer, { listKey, name: 'deleteMutation' }, list, list.deleteMutation)
        patchedList.deleteManyMutation = _getTracedMutationFunction(tracer, { listKey, name: 'deleteManyMutation' }, list, list.deleteManyMutation)

        patchedList.listQuery = _getTracedQueryFunction(tracer, { listKey, name: 'listQuery' }, list, list.listQuery)
        patchedList.itemQuery = _getTracedQueryFunction(tracer, { listKey, name: 'itemQuery' }, list, list.itemQuery)

        return patchedList
    })
}


const _getTracedAdapterFunction = (tracer, config, ctx, f) => {
    const { name, listKey } = config

    return _getTracedFunction({
        name: name + DELIMETER + listKey,
        spanHook: (span, _) => {
            span.setAttribute('type', 'adapter')
            span.setAttribute('listKey', listKey)
            span.setAttribute('functionName', name)
        },
        ctx, f, tracer,
    })
}


const _patchKeystoneAdapter = (tracer, keystone) => {
    for (const listAdapter of Object.values(get(keystone, ['adapter', 'listAdapters']))) {
        const originalListAdapter = listAdapter
        const listKey = listAdapter.key

        listAdapter.find = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:find' }, listAdapter, originalListAdapter.find)
        listAdapter.findOne = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:findOne' }, listAdapter, originalListAdapter.findOne)
        listAdapter.findById = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:findById' }, listAdapter, originalListAdapter.findById)
        listAdapter.itemsQuery = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:itemsQuery' }, listAdapter, originalListAdapter.itemsQuery)

        listAdapter.create = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:create' }, listAdapter, originalListAdapter.create)
        listAdapter.delete = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:delete' }, listAdapter, originalListAdapter.delete)
        listAdapter.update = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:update' }, listAdapter, originalListAdapter.update)

        listAdapter.createMany = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.createMany)
        listAdapter.deleteMany = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.deleteMany)
        listAdapter.updateMany = _getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.updateMany)
    }
}

const patchKeystone = (tracer, keystone) => {
    _patchKeystoneGraphQLExecutor(tracer, keystone)
    _patchKeystoneList(tracer, keystone)
    _patchKeystoneAdapter(tracer, keystone)
}


module.exports = {
    patchKeystone,
}