const { gql } = require('graphql-tag')
const pluralize = require('pluralize')

const DEFAULT_PAGE_SIZE = 100

function getModelForms (key) {
    const MODEL = pluralize.singular(key)
    const MODELS = pluralize.plural(key)
    return [MODEL, MODELS]
}

function generateGetAllGQL (key, fields, prefix = '') {
    const [MODEL, MODELS] = getModelForms(key)
    const capitalizedPrefix = prefix.length ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ''
    const queryName = prefix ? `${prefix}All${MODELS}` : `all${MODELS}`
    const whereName = `${capitalizedPrefix}${MODEL}WhereInput`
    const sortName = `${capitalizedPrefix}Sort${MODELS}By`

    return gql`
         query getAll${MODELS}($where: ${whereName}, $first: Int = ${DEFAULT_PAGE_SIZE}, $skip: Int, $sortBy: [${sortName}!]) {
             objs: ${queryName}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
         }
    `
}

function generateGetCountGQL (key, prefix = '') {
    const [MODEL, MODELS] = getModelForms(key)
    const metaQueryName = `${prefix}_all${MODELS}Meta`
    const capitalizedPrefix = prefix.length ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ''
    const whereName = `${capitalizedPrefix}${MODEL}WhereInput`

    return gql`
         query get${MODELS}Meta($where: ${whereName}) {
             meta: ${metaQueryName}(where: $where) { count }
         }
    `
}

function generateGetAllWithCountGQL (key, fields, prefix = '') {
    const [MODEL, MODELS] = getModelForms(key)
    const metaQueryName = `${prefix}_all${MODELS}Meta`
    const queryName = prefix ? `${prefix}All${MODELS}` : `all${MODELS}`
    const capitalizedPrefix = prefix.length ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ''
    const whereName = `${capitalizedPrefix}${MODEL}WhereInput`
    const sortName = `${capitalizedPrefix}Sort${MODELS}By`

    return gql`
         query getAll${MODELS}($where: ${whereName}, $first: Int = ${DEFAULT_PAGE_SIZE}, $skip: Int, $sortBy: [${sortName}!]) {
             objs: ${queryName}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${fields}
             meta: ${metaQueryName}(where: $where) { count }
         }
    `
}

function generateCreateGQL (key, fields, prefix = '') {
    const [MODEL] = getModelForms(key)
    const capitalizedPrefix = prefix.length ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ''
    const mutationName = prefix ? `${prefix}Create${MODEL}` : `create${MODEL}`
    const inputName = `${capitalizedPrefix}${MODEL}CreateInput`

    return gql`
         mutation create${MODEL}($data: ${inputName}) {
             obj: ${mutationName}(data: $data) ${fields}
         }
    `
}

function generateCreateManyGQL (key, fields, prefix = '') {
    const [, MODELS] = getModelForms(key)
    const capitalizedPrefix = prefix.length ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ''
    const mutationName = prefix ? `${prefix}Create${MODELS}` : `create${MODELS}`
    const inputName = `${capitalizedPrefix}${MODELS}CreateInput`

    return gql`
         mutation create${MODELS}($data: [${inputName}]) {
             objs: ${mutationName}(data: $data) ${fields}
         }
    `
}

function generateUpdateGQL (key, fields, prefix = '') {
    const [MODEL] = getModelForms(key)
    const mutationName = prefix ? `${prefix}Update${MODEL}` : `update${MODEL}`
    const capitalizedPrefix = prefix.length ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ''
    const inputName = `${capitalizedPrefix}${MODEL}UpdateInput`

    return gql`
         mutation update${MODEL}($id: ID!, $data: ${inputName}) {
             obj: ${mutationName}(id: $id, data: $data) ${fields}
         }
    `
}

function generateUpdateManyGQL (key, fields, prefix = '') {
    const [, MODELS] = getModelForms(key)
    const capitalizedPrefix = prefix.length ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ''
    const mutationName = prefix ? `${prefix}Update${MODELS}` : `update${MODELS}`
    const inputName = `${capitalizedPrefix}${MODELS}UpdateInput`
    return gql`
         mutation update${MODELS}($data: [${inputName}]) {
             objs: ${mutationName}(data: $data) ${fields}
         }
    `
}

// TODO(DOMA-4411): add prefix or remove at all
function generateDeleteGQL (key, fields) {
    const [MODEL] = getModelForms(key)
    return gql`
        mutation delete${MODEL}($id: ID!) {
            obj: delete${MODEL}(id: $id) ${fields}
        }
    `
}

// TODO(DOMA-4411): add prefix or remove at all
function generateDeleteMany (key, fields) {
    const [, MODELS] = getModelForms(key)
    return gql`
        mutation delete${MODELS}($ids: [ID!]) {
            objs: delete${MODELS}(ids: $ids) ${fields}
        }
    `
}

function generateGqlQueries (key, fields, prefix = '') {
    const [singularName, pluralName] = getModelForms(key)

    if (!fields.startsWith('{') || !fields.endsWith('}'))
        throw new Error('wrong list fields format. Try "{ name1 name2 }"')

    const GET_ALL_OBJS_QUERY = generateGetAllGQL(singularName, fields, prefix)
    const GET_COUNT_OBJS_QUERY = generateGetCountGQL(singularName, prefix)
    const GET_ALL_OBJS_WITH_COUNT_QUERY = generateGetAllWithCountGQL(singularName, fields, prefix)
    const CREATE_OBJ_MUTATION = generateCreateGQL(singularName, fields, prefix)
    const CREATE_OBJS_MUTATION = generateCreateManyGQL(singularName, fields, prefix)
    const UPDATE_OBJ_MUTATION = generateUpdateGQL(singularName, fields, prefix)
    const UPDATE_OBJS_MUTATION = generateUpdateManyGQL(singularName, fields, prefix)
    const DELETE_OBJ_MUTATION = generateDeleteGQL(singularName, fields)
    const DELETE_OBJS_MUTATION = generateDeleteMany(singularName, fields)

    return {
        SINGULAR_FORM: singularName,
        PLURAL_FORM: pluralName,
        MODEL_FIELDS: fields,
        GET_ALL_OBJS_QUERY,
        GET_COUNT_OBJS_QUERY,
        GET_ALL_OBJS_WITH_COUNT_QUERY,
        CREATE_OBJ_MUTATION,
        CREATE_OBJS_MUTATION,
        UPDATE_OBJ_MUTATION,
        UPDATE_OBJS_MUTATION,
        DELETE_OBJ_MUTATION,
        DELETE_OBJS_MUTATION,
    }
}

function generateQueryWhereInput (schemaName, fieldsObj) {
    // TODO: DOMA-12051 it is possible to generate this all and more automatically, using @keystonejs fields, as they can return all possible filter for them
    // but there is currently problems with pragma jsx lines in @open-keystone fields
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
            case 'Decimal':
            case 'CalendarDay':
            case 'Int': {
                const returnType = type === 'Int' ? 'Int' : 'String'
                return `
                    ${name}: ${returnType},
                    ${name}_not: ${returnType},
                    ${name}_lt: ${returnType},
                    ${name}_gt: ${returnType},
                    ${name}_lte: ${returnType},
                    ${name}_gte: ${returnType},
                    ${name}_in: [${returnType}],
                    ${name}_not_in: [${returnType}]
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
            //TODO(nomerdvadcatpyat): default is a Model type, change it after
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
    const [, MODELS] = getModelForms(schemaName)

    const resFields = fields.map(field => (
        `
        ${field}_ASC,
        ${field}_DESC
        `
    )).join(',')

    return `
        enum Sort${MODELS}By {
            ${resFields}
        }
    `
}

module.exports = {
    getModelForms,
    generateGqlQueries,
    generateQueryWhereInput,
    generateQuerySortBy,
    generateGetAllGQL,
    generateGetCountGQL,
    generateCreateGQL,
    generateCreateManyGQL,
    generateUpdateGQL,
    generateUpdateManyGQL,
    generateDeleteGQL,
}
