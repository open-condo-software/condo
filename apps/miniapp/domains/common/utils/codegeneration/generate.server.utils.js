const { pickBy } = require('lodash')

const isNotUndefined = (x) => typeof x !== 'undefined'

async function execGqlWithoutAccess (context, { query, variables, errorMessage = '[error] Internal Exec GQL Error', dataPath = 'obj' }) {
    if (!context) throw new Error('wrong context argument')
    if (!query) throw new Error('wrong query argument')
    if (!variables) throw new Error('wrong variables argument')
    const { errors, data } = await context.executeGraphQL({
        context: context.createContext({ skipAccessControl: true }),
        variables: pickBy(variables, isNotUndefined),
        query,
    })

    if (errors) {
        if (errors.some(e => e.originalError && e.originalError.data)) {
            console.warn(errors.map((err) => (err.originalError && err.originalError.data)))
        }
        console.error(errors)
        const error = new Error(errorMessage)
        error.errors = errors
        throw error
    }

    if (!data || typeof data !== 'object') {
        throw new Error('wrong query result')
    }

    return data[dataPath]
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

    async function count (context, where, { sortBy, first, skip } = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        return await execGqlWithoutAccess(context, {
            query: gql.GET_COUNT_OBJS_QUERY,
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'objs',
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

    return {
        gql,
        getAll, count,
        create, update,
        delete: delete_,
    }
}

module.exports = {
    generateServerUtils,
    execGqlWithoutAccess,
}
