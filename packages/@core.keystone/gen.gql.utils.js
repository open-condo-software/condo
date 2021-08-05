const pluralize = require('pluralize')
const { gql } = require('graphql-tag')

const DEFAULT_PAGE_SIZE = 100

function _genGQLName (key) {
    const MODEL = pluralize.singular(key)
    const MODELS = pluralize.plural(key)
    return [MODEL, MODELS]
}

function genGetAllGQL (key, fields) {
    const [MODEL, MODELS] = _genGQLName(key)
    return gql`
        query getAll${MODELS}($where: ${MODEL}WhereInput, $first: Int = ${DEFAULT_PAGE_SIZE}, $skip: Int, $sortBy: [Sort${MODELS}By!]) {
            objs: all${MODELS}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
        }
    `
}

function genGetCountGQL (key) {
    const [MODEL, MODELS] = _genGQLName(key)
    return gql`
        query get${MODELS}Meta($where: ${MODEL}WhereInput) {
        meta: _all${MODELS}Meta(where: $where) { count }
        }
    `
}

function genGetAllWithCountGQL (key, fields) {
    const [MODEL, MODELS] = _genGQLName(key)
    return gql`
        query getAll${MODELS}($where: ${MODEL}WhereInput, $first: Int = ${DEFAULT_PAGE_SIZE}, $skip: Int, $sortBy: [Sort${MODELS}By!]) {
            objs: all${MODELS}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
            meta: _all${MODELS}Meta(where: $where) { count }
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
    const [MODEL, MODELS] = _genGQLName(key)
    if (!fields.startsWith('{') || !fields.endsWith('}'))
        throw new Error('wrong list fields format. Try "{ name1 name2 }"')
    const GET_ALL_OBJS_QUERY = genGetAllGQL(MODEL, fields)
    const GET_COUNT_OBJS_QUERY = genGetCountGQL(MODEL)
    const GET_ALL_OBJS_WITH_COUNT_QUERY = genGetAllWithCountGQL(MODEL, fields)
    const CREATE_OBJ_MUTATION = genCreateGQL(MODEL, fields)
    const UPDATE_OBJ_MUTATION = genUpdateGQL(MODEL, fields)
    const DELETE_OBJ_MUTATION = genDeleteGQL(MODEL, fields)

    async function getAll (client, where, { raw = false, sortBy } = {}) {
        const { data, errors } = await client.query(GET_ALL_OBJS_QUERY, { where: where, sortBy })
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
        MODEL, MODELS,
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

function generateQueryWhereInput (schemaName, fieldsObj) {
    const resFields = Object.entries(fieldsObj).map(([ name, type ]) => {
        switch (type) {
            case 'ID': {
                return `
                    ${name}: ID,
                    ${name}_not: ID,
                    ${name}_in: [ID],
                    ${name}_not_in: [ID]
                `
            }
            case 'Int': {
                return `
                    ${name}: Int,
                    ${name}_not: Int,
                    ${name}_lt: Int,
                    ${name}_gt: Int,
                    ${name}_lte: Int,
                    ${name}_gte: Int,
                    ${name}_in: [Int],
                    ${name}_not_in: [Int]
                `
            }
            case 'Boolean': {
                return `
                    ${name}: Boolean,
                    ${name}_not: Boolean
                    `
            }
            case 'String': {
                return `
                    ${name}: String,
                    ${name}_not: String,
                    ${name}_contains: String,
                    ${name}_not_contains: String,
                    ${name}_starts_with: String,
                    ${name}_not_starts_with: String,
                    ${name}_ends_with: String,
                    ${name}_not_ends_with: String,
                    ${name}_i: String,
                    ${name}_not_i: String,
                    ${name}_contains_i: String,
                    ${name}_not_contains_i: String,
                    ${name}_starts_with_i: String,
                    ${name}_not_starts_with_i: String,
                    ${name}_ends_with_i: String,
                    ${name}_not_ends_with_i: String
                `
            }
            // default is a Model type, change it after
            default: {
                return `
                    ${name}: ${type}WhereInput,
                    ${name}_is_null: Boolean,
                `
            }
        }
    }).join(',')

    return `
        input ${schemaName}WhereInput {
            AND: [${schemaName}WhereInput],
            OR: [${schemaName}WhereInput],
            ${resFields}
        }
    `
}

function generateQuerySortBy (schemaName, fields) {
    const resFields = fields.map(field => (
        `
        ${field}_ASC,
        ${field}_DESC
        `
    )).join(',')

    //TODO(nomerdvadcatpyat): generate normal plural name
    return `
        enum Sort${schemaName}sBy {
            ${resFields}
        }
    `
}

module.exports = {
    genGetAllGQL,
    genCreateGQL,
    genUpdateGQL,
    genDeleteGQL,
    genTestGQLUtils,
    generateQueryWhereInput,
    generateQuerySortBy,
}
