const faker = require('faker')
const { print } = require('graphql')
const { get, isEmpty } = require('lodash')
const falsey = require('falsey')

const { normalizeQuery } = require('../GraphQLLoggerApp')

const EXTRA_LOGGING = falsey(process.env.DISABLE_LOGGING)


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
        if (EXTRA_LOGGING) {
            const errorsToShow = errors.filter(error => get(error, 'originalError.data') || get(error, 'originalError.internalData'))
            if (!isEmpty(errorsToShow)) errorsToShow.forEach((error) => console.warn(get(error, 'originalError.data'), '\n', get(error, 'originalError.internalData')))
            console.warn(errors)
        }
        throw new TestClientResponseError(data, errors, context)
    }
}

function _checkClient (client) {
    if (!client) throw new Error('no client argument')
    if (typeof client !== 'object') throw new Error('The client argument should be an object type')
    if (client.then) throw new Error('The client argument is a Promise! Probably you should to await it')
}

function _renderDeveloperFriendlyErrorMessage (data, errors, context) {
    let msg = ['', '--request--']

    if (get(context, 'query')) {
        msg.push(`QUERY: ${normalizeQuery(print(context.query))}`)
    } else {
        msg.push('QUERY: context was not send! check the throwIfError( ... ) third argument!')
    }

    if (get(context, 'variables')) {
        msg.push(`VARIABLES: ${JSON.stringify(context.variables)}`)
    } else {
        msg.push('VARIABLES: context was not send! check the throwIfError( ... ) third argument!')
    }

    msg.push('--response--')

    if (data) {
        msg.push(`DATA: ${JSON.stringify(data)}`)
    } else {
        msg.push('DATA: no or empty')
    }

    if (errors) {
        msg.push(`ERRORS: ${JSON.stringify(errors, null, 2)}`)
    } else {
        msg.push('ERRORS: no or empty')
    }

    return msg.join('\n')
}

function generateGQLTestUtils (gql) {

    async function getAll (client, where, { raw = false, sortBy } = {}) {
        _checkClient(client)
        const { data, errors } = await client.query(gql.GET_ALL_OBJS_QUERY, { where: where, sortBy })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.GET_ALL_OBJS_QUERY, variables: { where: where, sortBy } })
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

    async function update (client, id, attrs = {}, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.UPDATE_OBJ_MUTATION, {
            id, data: { ...attrs },
        })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.UPDATE_OBJ_MUTATION, variables: { id, data: { ...attrs } } })
        return data.obj
    }

    async function delete_ (client, id, { raw = false } = {}) {
        _checkClient(client)
        const { data, errors } = await client.mutate(gql.DELETE_OBJ_MUTATION, { id })
        if (raw) return { data, errors }
        throwIfError(data, errors, { query: gql.DELETE_OBJ_MUTATION, variables: { id } })
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
        update,
        delete: delete_,
        softDelete,
        updateOrCreate,
    }
}

module.exports = {
    throwIfError,
    generateGQLTestUtils,
}
