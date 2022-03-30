const pluralize = require('pluralize')
const { gql } = require('graphql-tag')

const DEFAULT_PAGE_SIZE = 100

function getModelForms (key) {
    const MODEL = pluralize.singular(key)
    const MODELS = pluralize.plural(key)
    return [MODEL, MODELS]
}

function genGetAllGQL (key, fields) {
    const [MODEL, MODELS] = getModelForms(key)
    return gql`
        query getAll${MODELS}($where: ${MODEL}WhereInput, $first: Int = ${DEFAULT_PAGE_SIZE}, $skip: Int, $sortBy: [Sort${MODELS}By!]) {
            objs: all${MODELS}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
        }
    `
}

function genGetCountGQL (key) {
    const [MODEL, MODELS] = getModelForms(key)
    return gql`
        query get${MODELS}Meta($where: ${MODEL}WhereInput) {
            meta: _all${MODELS}Meta(where: $where) { count }
        }
    `
}

function genGetAllWithCountGQL (key, fields) {
    const [MODEL, MODELS] = getModelForms(key)
    return gql`
        query getAll${MODELS}($where: ${MODEL}WhereInput, $first: Int = ${DEFAULT_PAGE_SIZE}, $skip: Int, $sortBy: [Sort${MODELS}By!]) {
            objs: all${MODELS}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
            meta: _all${MODELS}Meta(where: $where) { count }
        }
    `
}

function genCreateGQL (key, fields) {
    const [MODEL] = getModelForms(key)
    return gql`
        mutation create${MODEL}($data: ${MODEL}CreateInput) {
            obj: create${MODEL}(data: $data) ${fields}
        }
    `
}

function genUpdateGQL (key, fields) {
    const [MODEL] = getModelForms(key)
    return gql`
        mutation update${MODEL}($id: ID!, $data: ${MODEL}UpdateInput) {
            obj: update${MODEL}(id: $id, data: $data) ${fields}
        }
    `
}

function genDeleteGQL (key, fields) {
    const [MODEL] = getModelForms(key)
    return gql`
        mutation delete${MODEL}($id: ID!) {
            obj: delete${MODEL}(id: $id) ${fields}
        }
    `
}

function generateGqlQueries (key, fields) {
    const [singularName, pluralName] = getModelForms(key)
    if (!fields.startsWith('{') || !fields.endsWith('}'))
        throw new Error('wrong list fields format. Try "{ name1 name2 }"')
    const GET_ALL_OBJS_QUERY = genGetAllGQL(singularName, fields)
    const GET_COUNT_OBJS_QUERY = genGetCountGQL(singularName)
    const GET_ALL_OBJS_WITH_COUNT_QUERY = genGetAllWithCountGQL(singularName, fields)
    const CREATE_OBJ_MUTATION = genCreateGQL(singularName, fields)
    const UPDATE_OBJ_MUTATION = genUpdateGQL(singularName, fields)
    const DELETE_OBJ_MUTATION = genDeleteGQL(singularName, fields)

    return {
        SINGULAR_FORM: singularName,
        PLURAL_FORM: pluralName,
        MODEL_FIELDS: fields,
        GET_ALL_OBJS_QUERY,
        GET_COUNT_OBJS_QUERY,
        GET_ALL_OBJS_WITH_COUNT_QUERY,
        CREATE_OBJ_MUTATION,
        UPDATE_OBJ_MUTATION,
        DELETE_OBJ_MUTATION,
    }
}

module.exports = {
    generateGqlQueries,
}
