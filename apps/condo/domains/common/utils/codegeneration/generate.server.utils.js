const { pickBy, get, isEmpty } = require('lodash')

const conf = require('@core/config')
const { getById } = require('@core/keystone/schema')

const IS_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'

const isNotUndefined = (x) => typeof x !== 'undefined'

function _throwIfError (context, errors, data, errorMessage) {
    if (errors) {
        if (IS_DEBUG) {
            const errorsToShow = errors.filter(error => get(error, 'originalError.data') || get(error, 'originalError.internalData'))
            if (!isEmpty(errorsToShow)) errorsToShow.forEach((error) => console.warn(get(error, 'originalError.data'), '\n', get(error, 'originalError.internalData')))
            console.error(errors)
        }
        // NOTE(pahaz): we will see this results in production at the ApolloErrorFormatter
        const error = new Error(errorMessage)
        error.errors = errors
        error.reqId = get(context, 'req.id')
        throw error
    }
    if (!data || typeof data !== 'object') {
        throw new Error('wrong query result')
    }
}

async function execGqlAsUser (context, user, { query, variables, errorMessage = '[error] Internal Exec as user GQL Error', authedListKey = 'User', dataPath = 'obj' }) {
    if (!context) throw new Error('missing context argument')
    if (!context.executeGraphQL) throw new Error('wrong context argument: no executeGraphQL')
    if (!context.createContext) throw new Error('wrong context argument: no createContext')
    if (!user) throw new Error('wrong user argument')
    if (!user.id) throw new Error('wrong user argument: no id')
    const item = await getById(authedListKey, user.id)
    // NOTE(pahaz): we don't check here deletedAt or isActive or any other fields!
    if (!item) throw new Error('unknown user id')
    const { errors, data } = await context.executeGraphQL({
        context: {
            req: context.req,
            ...context.createContext({
                authentication: { item, listKey: authedListKey },
                skipAccessControl: false,
            }),
        },
        variables: pickBy(variables, isNotUndefined),
        query,
    })

    _throwIfError(context, errors, data, errorMessage)

    return (dataPath) ? get(data, dataPath) : data
}

async function execGqlWithoutAccess (context, { query, variables, errorMessage = '[error] Internal Exec GQL Error', dataPath = 'obj' }) {
    if (!context) throw new Error('missing context argument')
    if (!context.executeGraphQL) throw new Error('wrong context argument: no executeGraphQL')
    if (!context.createContext) throw new Error('wrong context argument: no createContext')
    if (!query) throw new Error('wrong query argument')
    if (!variables) throw new Error('wrong variables argument')
    const { errors, data } = await context.executeGraphQL({
        context: {
            req: context.req,
            ...context.createContext({ skipAccessControl: true }),
        },
        variables: pickBy(variables, isNotUndefined),
        query,
    })

    _throwIfError(context, errors, data, errorMessage)

    return (dataPath) ? get(data, dataPath) : data
}

function generateServerUtils (gql) {
    async function getAll (context, where, { sortBy, first, skip } = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        return await execGqlWithoutAccess(context, {
            query: gql.GET_ALL_OBJS_QUERY,
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'objs',
        })
    }

    async function getOne (context, where, params = {}) {
        const objs = await getAll(context, where, { first: 2, ...params })

        if (objs.length > 1) throw new Error('getOne() got more than one result, check filters/logic please')

        return objs[0] // will return undefined by default, if objs is empty :)
    }

    async function count (context, where, { sortBy, first, skip } = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        return await execGqlWithoutAccess(context, {
            query: gql.GET_COUNT_OBJS_QUERY,
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'meta.count',
        })
    }

    async function create (context, data) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        return await execGqlWithoutAccess(context, {
            query: gql.CREATE_OBJ_MUTATION,
            variables: { data },
            errorMessage: `[error] Create ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
        })
    }

    async function update (context, id, data) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        if (!data) throw new Error('no data')
        return await execGqlWithoutAccess(context, {
            query: gql.UPDATE_OBJ_MUTATION,
            variables: { id, data },
            errorMessage: `[error] Update ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
        })
    }

    async function delete_ (context, id) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        return await execGqlWithoutAccess(context, {
            query: gql.DELETE_OBJ_MUTATION,
            variables: { id },
            errorMessage: `[error] Delete ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
        })
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
        create,
        update,
        updateOrCreate,
        delete: delete_,
    }
}

module.exports = {
    generateServerUtils,
    execGqlAsUser,
    execGqlWithoutAccess,
}
