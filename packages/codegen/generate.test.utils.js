const { faker } = require('@faker-js/faker')
const { print } = require('graphql')
const { get, isEmpty } = require('lodash')

const { normalizeQuery } = require('@open-condo/keystone/logging/normalize')

class TestClientResponseError extends Error {
    constructor (data, errors, context = {}) {
        super(`Test client caught GraphQL response with not empty errors body! ${_renderDeveloperFriendlyErrorMessage(data, errors, context)}`)
        this.errors = errors
        this.data = data
        this.context = context
        this.name = 'TestClientResponseError'
    }
}

function throwIfError (data, errors, context = {}) {
    const supportedKeys = ['query', 'variables']
    const hasUnsupportedKeys = Object.keys(context).filter((key) => !supportedKeys.includes(key))
    if (!isEmpty(hasUnsupportedKeys)) throw new Error(`throwIfError(data, errors, context) has unsupported context keys: ${hasUnsupportedKeys.join(', ')}`)
    if (errors) {
        throw new TestClientResponseError(data, errors, context)
    }
}

function _checkClient (client) {
    if (!client) throw new Error('no client argument')
    if (typeof client !== 'object') throw new Error('The client argument should be an object type')
    if (client.then) throw new Error('The client argument is a Promise! Probably you should to await it')
}

/**
 * Replaces cyclic links within object for JSON.stringify to be able to serialize object properly
 * usage: JSON.stringify(obj, getCycleReplacer(), 2)
 * @returns {function(*, *=): *}
 */
const getCycleReplacer = () => {
    const visited = new WeakSet()

    return (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (visited.has(value)) return `<Cycled link to ${key}>`

            visited.add(value)
        }

        return value
    }
}

function _renderDeveloperFriendlyErrorMessage (data, errors, context) {
    let msg = ['', '--request--']

    if (get(context, 'query')) {
        msg.push(`QUERY: ${normalizeQuery(print(context.query))}`)
    } else {
        msg.push('QUERY: context was not send! check the throwIfError( ... ) third argument!')
    }

    if (get(context, 'variables')) {
        msg.push(`VARIABLES: ${JSON.stringify(context.variables, getCycleReplacer())}`)
    } else {
        msg.push('VARIABLES: context was not send! check the throwIfError( ... ) third argument!')
    }

    msg.push('--response--')

    if (data) {
        msg.push(`DATA: ${JSON.stringify(data, getCycleReplacer())}`)
    } else {
        msg.push('DATA: no or empty')
    }

    if (errors) {
        msg.push(`ERRORS: ${JSON.stringify(errors, getCycleReplacer(), 2)}`)
    } else {
        msg.push('ERRORS: no or empty')
    }

    return msg.join('\n')
}

function generateGQLTestUtils (gql) {

    async function getAll (client, where, { raw = false, sortBy, first } = {}) {
        _checkClient(client)
        const { data, errors } = await client.query(gql.GET_ALL_OBJS_QUERY, { where, sortBy, first })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.GET_ALL_OBJS_QUERY, variables: { where, sortBy, first } })
        return data.objs
    }

    async function getOne (context, where, params = {}) {
        const objs = await getAll(context, where, { first: 2, ...params })

        if (objs.length > 1) throw new Error('getOne() got more than one result, check filters/logic please')

        return objs[0] // will return undefined by default, if objs is empty :)
    }

    async function count (client, where, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.query(gql.GET_COUNT_OBJS_QUERY, { where: where })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.GET_COUNT_OBJS_QUERY, variables: { where: where } })
        return data.meta.count
    }

    async function getAllWithMeta (client, where, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.query(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, { where: where })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.GET_ALL_OBJS_WITH_COUNT_QUERY, variables: { where: where } })
        return data.meta.count
    }

    async function create (client, attrs = {}, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.CREATE_OBJ_MUTATION, {
            data: { ...attrs },
        })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.CREATE_OBJ_MUTATION, variables: { data: { ...attrs } } })
        return data.obj
    }

    async function createMany (client, attrsArray = [], { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await  client.mutate(gql.CREATE_OBJS_MUTATION, {
            data: [...attrsArray],
        })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.CREATE_OBJS_MUTATION, variables: { data: [...attrsArray] } })
        return data.objs
    }

    async function update (client, id, attrs = {}, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.UPDATE_OBJ_MUTATION, {
            id, data: { ...attrs },
        })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.UPDATE_OBJ_MUTATION, variables: { id, data: { ...attrs } } })
        return data.obj
    }

    async function updateMany (client, attrsArray = [], { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.UPDATE_OBJS_MUTATION, {
            data: [ ...attrsArray ],
        })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.UPDATE_OBJS_MUTATION, variables: { data: [...attrsArray] } })
        return data.objs
    }

    async function delete_ (client, id, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.DELETE_OBJ_MUTATION, { id })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.DELETE_OBJ_MUTATION, variables: { id } })
        return data.obj
    }

    async function deleteMany_ (client, ids, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.DELETE_OBJS_MUTATION, { ids })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.DELETE_OBJS_MUTATION, variables: { ids } })
        return data.obj
    }

    async function softDelete (client, id, extraAttrs = {}, { raw = false } = {}) {
        const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
        const attrs = {
            dv: 1,
            sender,
            deletedAt: 'true',
            ...extraAttrs,
        }
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.UPDATE_OBJ_MUTATION, { id, data: { ...attrs } })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.UPDATE_OBJ_MUTATION, variables: { id, data: { ...attrs } } })
        return [data.obj, attrs]
    }

    /**
     * Tries to receive existing item, and updates it on success or creates new one. Updated/created value is returned.
     * Attention! Be careful with where. Because of getOne, this helper will throw exception, if it gets 1+ items.
     * @param context
     * @param where
     * @param attrs
     * @returns {Promise<*|null|undefined>}
     */
    async function updateOrCreate (context, where, attrs) {
        const existingItem = await getOne(context, where)
        const shouldUpdate = Boolean(existingItem && existingItem.id)

        return shouldUpdate
            ? await update(context, existingItem.id, attrs)
            : await create(context, attrs)
    }

    return {
        gql,
        getAll,
        getOne,
        count,
        getAllWithMeta,
        create,
        createMany,
        update,
        updateMany,
        delete: delete_,
        deleteMany: deleteMany_,
        softDelete,
        updateOrCreate,
    }
}

module.exports = {
    throwIfError,
    generateGQLTestUtils,
}
