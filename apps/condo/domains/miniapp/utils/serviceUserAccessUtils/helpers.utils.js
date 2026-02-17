const { gql } = require('graphql-tag')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const isString = require('lodash/isString')
const memoize = require('lodash/memoize')
const pluralize = require('pluralize')


/**
 *
 * @param pathToField {string[]}
 * @return {string}
 *
 * @example
 * Input: ['a', 'b', 'c']
 * Output: '{ a { b { c } } }'
 */
const generateGqlDataPartToField = (pathToField) => {
    if (!pathToField || !isArray(pathToField) || isEmpty(pathToField)) throw new Error('"pathToField" should not be empty array')
    return `{ ${pathToField.join(' { ')}${' }'.repeat(pathToField.length)}`
}

/**
 *
 * @param listKey
 * @param pathToField
 * @return {string}
 *
 * @example
 * Input: ('Ticket', ['organization', 'id'])
 * Output: `
 *         query getAllTickets ($where: TicketWhereInput, $first: Int = 1) {
 *             objs: allTickets(where: $where, first: $first) { organization { id } }
 *         }
 *     `
 */
const generateGqlQueryToFieldAsString = (listKey, pathToField) => {
    if (!isString(listKey) || listKey.trim().length < 1) throw new Error('"listKey" must not be empty string!')
    if (!pathToField || !isArray(pathToField) || isEmpty(pathToField)) throw new Error('"pathToField" should not be empty array')

    return `
        query getAll${pluralize.plural(listKey)} ($where: ${listKey}WhereInput, $first: Int = 1) {
            objs: all${pluralize.plural(listKey)}(where: $where, first: $first) ${generateGqlDataPartToField(pathToField)}
        }
    `
}

/**
 *
 * @param pathToField {string[]}
 * @param schemaName {string}
 * @return {*|DocumentNode}
 *
 * @example
 * Input: ('MySchemaName', ['myField', 'organization', 'id'])
 * Output: gql`
 *         query getAllMySchemaNames ($where: MySchemaNameWhereInput, $first: Int = 1) {
 *             objs: allMySchemaNames(where: $where, first: $first) { myField { organization { id } } }
 *         }
 *     `
 */
const generateGqlQueryToField = memoize((schemaName, pathToField) => {
    if (schemaName && (!isString(schemaName) || schemaName.trim().length < 1)) throw new Error(`"schemaName" should be not empty string! But was: "${schemaName}"`)
    if (!pathToField || !isArray(pathToField) || isEmpty(pathToField)) throw new Error('"pathToField" should not be empty array')
    if (pathToField.length < 1) throw new Error(`To generate gql "pathToField" must contain at least one elements! But was ${pathToField}`)

    return gql`${generateGqlQueryToFieldAsString(schemaName, pathToField)}`
})

/**
 *
 * @param pathToField {string[]}
 * @param fieldValues {string[]}
 * @return {{[p: string]: *, deletedAt: null}|{[p: number]: {deletedAt: null}|{deletedAt: null}, deletedAt: null}}
 *
 * @example
 * Input: (['ticket', 'organization', 'id'], ['cdcbf4f8-a5b2-4831-bfb0-354a0abe0aa3'])
 * Output: {
 *     ticket: {
 *         organization: {
 *             id_in: ['cdcbf4f8-a5b2-4831-bfb0-354a0abe0aa3'],
 *             deletedAt, null,
 *         },
 *         deletedAt, null,
 *     },
 *     deletedAt, null,
 * }
 */
const getFilterByFieldPathValues = (pathToField, fieldValues) => {
    if (!isArray(pathToField) || isEmpty(pathToField)) throw new Error('"pathToField" must be not empty array!')
    if (!isArray(fieldValues)) throw new Error('"fieldValues" must be array!')

    if (pathToField.length === 1) {
        return {
            [`${pathToField[0]}_in`]: fieldValues,
            deletedAt: null,
        }
    }

    return {
        [pathToField[0]]: getFilterByFieldPathValues(pathToField.slice(1), fieldValues),
        deletedAt: null,
    }
}

module.exports = {
    getFilterByFieldPathValues,
    generateGqlQueryToField,
    generateGqlDataPartToField,
    generateGqlQueryToFieldAsString,
}
