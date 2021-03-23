function _checkError (data, errors) {
    if (errors) {
        const err = new Error('GraphQLError')
        err.errors = errors
        err.data = data
        throw err
    }
}

function generateGQLTestUtils (gql) {

    async function getAll (client, where, { raw = false, sortBy } = {}) {
        const { data, errors } = await client.query(gql.GET_ALL_OBJS_QUERY, { where: where, sortBy })
        if (raw) return { data, errors }
        _checkError(data, errors)
        return data.objs
    }

    async function count (client, where, { raw = false } = {}) {
        const { data, errors } = await client.query(gql.GET_COUNT_OBJS_QUERY, { where: where })
        if (raw) return { data, errors }
        _checkError(data, errors)
        return data.meta.count
    }

    async function getAllWithMeta (client, where, { raw = false } = {}) {
        const { data, errors } = await client.query(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, { where: where })
        if (raw) return { data, errors }
        _checkError(data, errors)
        return data.meta.count
    }

    async function create (client, attrs = {}, { raw = false } = {}) {
        const { data, errors } = await client.mutate(gql.CREATE_OBJ_MUTATION, {
            data: { ...attrs },
        })
        if (raw) return { data, errors }
        _checkError(data, errors)
        return data.obj
    }

    async function update (client, id, attrs = {}, { raw = false } = {}) {
        const { data, errors } = await client.mutate(gql.UPDATE_OBJ_MUTATION, {
            id, data: { ...attrs },
        })
        if (raw) return { data, errors }
        _checkError(data, errors)
        return data.obj
    }

    async function delete_ (client, id, { raw = false } = {}) {
        const { data, errors } = await client.mutate(gql.DELETE_OBJ_MUTATION, { id })
        if (raw) return { data, errors }
        _checkError(data, errors)
        return data.obj
    }

    return {
        gql,
        getAll, count,
        getAllWithMeta,
        create, update,
        delete: delete_,
    }
}

module.exports = {
    generateGQLTestUtils,
}
