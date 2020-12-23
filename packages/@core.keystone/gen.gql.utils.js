const pluralize = require('pluralize')
const gql = require('graphql-tag')

function _genGQLName (key) {
    const MODEL = pluralize.singular(key)
    const MODELs = pluralize.plural(key)
    return [MODEL, MODELs]
}

function genGetAllGQL (key, fields) {
    const [MODEL, MODELs] = _genGQLName(key)
    return gql`
        query getAll${MODELs}($where: ${MODEL}WhereInput, $first: Int, $skip: Int, $sortBy: [Sort${MODELs}By!]) {
            objs: all${MODELs}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
        }
    `
}

function genGetCountGQL (key) {
    const [MODEL, MODELs] = _genGQLName(key)
    return gql`
        query get${MODELs}Meta($where: ${MODEL}WhereInput) {
        meta: _all${MODELs}Meta(where: $where) { count }
        }
    `
}

function genGetAllWithCountGQL (key, fields) {
    const [MODEL, MODELs] = _genGQLName(key)
    return gql`
        query getAll${MODELs}($where: ${MODEL}WhereInput, $first: Int, $skip: Int, $sortBy: [Sort${MODELs}By!]) {
            objs: all${MODELs}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
            meta: _all${MODELs}Meta(where: $where) { count }
        }
    `
}

function genCreateGQL (key, fields) {
    const [MODEL] = _genGQLName(key)
    return gql`
        mutation create${MODEL}($data: ${MODEL}CreateInput) {
            obj: create${MODEL}(data: $data) ${fields}
        }
    `
}

function genUpdateGQL (key, fields) {
    const [MODEL] = _genGQLName(key)
    return gql`
        mutation update${MODEL}($id: ID!, $data: ${MODEL}UpdateInput) {
            obj: update${MODEL}(id: $id, data: $data) ${fields}
        }
    `
}

function genDeleteGQL (key, fields) {
    const [MODEL] = _genGQLName(key)
    return gql`
        mutation delete${MODEL}($id: ID!) {
            obj: delete${MODEL}(id: $id) ${fields}
        }
    `
}

function genTestGQLUtils (key, fields) {
    const [MODEL, MODELs] = _genGQLName(key)
    if (!fields.startsWith('{') || !fields.endsWith('}'))
        throw new Error('wrong list fields format. Try "{ name1 name2 }"')
    const GET_ALL_OBJS_QUERY = genGetAllGQL(MODEL, fields)
    const GET_COUNT_OBJS_QUERY = genGetCountGQL(MODEL)
    const GET_ALL_OBJS_WITH_COUNT_QUERY = genGetAllWithCountGQL(MODEL, fields)
    const CREATE_OBJ_MUTATION = genCreateGQL(MODEL, fields)
    const UPDATE_OBJ_MUTATION = genUpdateGQL(MODEL, fields)
    const DELETE_OBJ_MUTATION = genDeleteGQL(MODEL, fields)

    async function getAll (client, where, { raw = false } = {}) {
        const { data, errors } = await client.query(GET_ALL_OBJS_QUERY, { where: where })
        if (raw) return { data, errors }
        expect(errors).toEqual(undefined)
        return data.objs
    }

    async function count (client, where, { raw = false } = {}) {
        const { data, errors } = await client.query(GET_COUNT_OBJS_QUERY, { where: where })
        if (raw) return { data, errors }
        expect(errors).toEqual(undefined)
        return data.meta.count
    }

    async function create (client, attrs = {}, { raw = false } = {}) {
        const { data, errors } = await client.mutate(CREATE_OBJ_MUTATION, {
            data: { ...attrs },
        })
        if (raw) return { data, errors }
        expect(errors).toEqual(undefined)
        return data.obj
    }

    async function update (client, id, attrs = {}, { raw = false } = {}) {
        const { data, errors } = await client.mutate(UPDATE_OBJ_MUTATION, {
            id, data: { ...attrs },
        })
        if (raw) return { data, errors }
        expect(errors).toEqual(undefined)
        return data.obj
    }

    async function delete_ (client, id, { raw = false } = {}) {
        const { data, errors } = await client.mutate(DELETE_OBJ_MUTATION, { id })
        if (raw) return { data, errors }
        expect(errors).toEqual(undefined)
        return data.obj
    }

    return {
        MODEL, MODELs,
        MODEL_FIELDS: fields,
        GET_ALL_OBJS_QUERY,
        GET_COUNT_OBJS_QUERY,
        GET_ALL_OBJS_WITH_COUNT_QUERY,
        CREATE_OBJ_MUTATION,
        UPDATE_OBJ_MUTATION,
        DELETE_OBJ_MUTATION,
        getAll, count,
        create, update,
        delete: delete_,
    }
}

module.exports = {
    genGetAllGQL,
    genCreateGQL,
    genUpdateGQL,
    genDeleteGQL,
    genTestGQLUtils,
}
