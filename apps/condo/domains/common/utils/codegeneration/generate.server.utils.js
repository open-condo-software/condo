const { pickBy, get } = require('lodash')
const { getById } = require('@core/keystone/schema')

const conf = require('@core/config')
const IS_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'

const isNotUndefined = (x) => typeof x !== 'undefined'

async function execGqlWithoutAccess (context, { query, variables, errorMessage = '[error] Internal Exec GQL Error', dataPath = 'obj' }) {
    if (!context) throw new Error('wrong context argument')
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

    if (errors) {
        if (errors.some(e => e.originalError && e.originalError.data)) {
            if (IS_DEBUG) console.warn(errors.map((err) => (err.originalError && err.originalError.data)))
        }
        if (IS_DEBUG) console.error(errors)
        const error = new Error(errorMessage)
        error.errors = errors
        throw error
    }

    if (!data || typeof data !== 'object') {
        throw new Error('wrong query result')
    }

    return get(data, dataPath)
}

function generateServerUtils (gql) {
    async function getAll (context, where, { sortBy, first, skip, fields } = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        return await execGqlWithoutAccess(context, {
            query: gql.GET_ALL_OBJS_QUERY(fields),
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'objs',
        })
    }

    async function getFirst (context, where, params = {}) {
        return await getAll(context, where, { first: 1, ...params })
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

    async function create (context, data, { fields } = {}) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        return await execGqlWithoutAccess(context, {
            query: gql.CREATE_OBJ_MUTATION(fields),
            variables: { data },
            errorMessage: `[error] Create ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
        })
    }

    async function update (context, id, data, { fields } = {}) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        if (!data) throw new Error('no data')
        return await execGqlWithoutAccess(context, {
            query: gql.UPDATE_OBJ_MUTATION(fields),
            variables: { id, data },
            errorMessage: `[error] Update ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
        })
    }

    async function delete_ (context, id, { fields } = {}) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        return await execGqlWithoutAccess(context, {
            query: gql.DELETE_OBJ_MUTATION(fields),
            variables: { id },
            errorMessage: `[error] Delete ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
        })
    }

    return {
        gql,
        getAll,
        getFirst,
        count,
        create,
        update,
        delete: delete_,
    }
}

module.exports = {
    generateServerUtils,
    execGqlWithoutAccess,
}
