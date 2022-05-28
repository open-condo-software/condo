const faker = require('faker')

const conf = require('@core/config')

const IS_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'

function throwIfError (data, errors) {
    if (errors) {
        if (IS_DEBUG && errors.some(e => e.originalError.data || e.originalError.internalData)) {
            errors.forEach((e) => console.warn(e.originalError.data, '\n', e.originalError.internalData))
        }
        if (IS_DEBUG) console.error(errors)
        const err = new Error(`TestRequestError: ${JSON.stringify(errors, null, 2)}`)
        err.errors = errors
        err.data = data
        throw err
    }
}

function checkClient (client) {
    if (!client) throw new Error('no client argument')
    if (typeof client !== 'object') throw new Error('The client argument should be an object type')
    if (client.then) throw new Error('The client argument is a Promise! Probably you should to await it')
}

function generateGQLTestUtils (gql) {

    async function getAll (client, where, { raw = false, sortBy } = {}) {
        checkClient(client)
        const { data, errors } = await client.query(gql.GET_ALL_OBJS_QUERY, { where: where, sortBy })
        if (raw) return { data, errors }
        throwIfError(data, errors)
        return data.objs
    }

    async function getOne (context, where, params = {}) {
        const objs = await getAll(context, where, { first: 2, ...params })

        if (objs.length > 1) throw new Error('getOne() got more than one result, check filters/logic please')

        return objs[0] // will return undefined by default, if objs is empty :)
    }

    async function count (client, where, { raw = false } = {}) {
        checkClient(client)
        const { data, errors } = await client.query(gql.GET_COUNT_OBJS_QUERY, { where: where })
        if (raw) return { data, errors }
        throwIfError(data, errors)
        return data.meta.count
    }

    async function getAllWithMeta (client, where, { raw = false } = {}) {
        checkClient(client)
        const { data, errors } = await client.query(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, { where: where })
        if (raw) return { data, errors }
        throwIfError(data, errors)
        return data.meta.count
    }

    async function create (client, attrs = {}, { raw = false } = {}) {
        checkClient(client)
        const { data, errors } = await client.mutate(gql.CREATE_OBJ_MUTATION, {
            data: { ...attrs },
        })
        if (raw) return { data, errors }
        throwIfError(data, errors)
        return data.obj
    }

    async function update (client, id, attrs = {}, { raw = false } = {}) {
        checkClient(client)
        const { data, errors } = await client.mutate(gql.UPDATE_OBJ_MUTATION, {
            id, data: { ...attrs },
        })
        if (raw) return { data, errors }
        throwIfError(data, errors)
        return data.obj
    }

    async function delete_ (client, id, { raw = false } = {}) {
        checkClient(client)
        const { data, errors } = await client.mutate(gql.DELETE_OBJ_MUTATION, { id })
        if (raw) return { data, errors }
        throwIfError(data, errors)
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
        checkClient(client)
        const { data, errors } = await client.mutate(gql.UPDATE_OBJ_MUTATION, { id, data: { ...attrs } })
        if (raw) return { data, errors }
        throwIfError(data, errors)
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
