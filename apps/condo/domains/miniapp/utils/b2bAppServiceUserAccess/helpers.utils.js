const { gql } = require('graphql-tag')
const { isArray, isEmpty, isString, memoize } = require('lodash')
const pluralize = require('pluralize')


/**
 *
 * @param pathToOrganizationId {string[]}
 * @return {string}
 *
 * @example
 * Input: ['a', 'b', 'c']
 * Output: '{ a { b { c } } }'
 */
const generateGqlDataPartToOrganizationId = (pathToOrganizationId) => {
    if (!pathToOrganizationId || !isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" should not be empty array')
    return `{ ${pathToOrganizationId.join(' { ')}${' }'.repeat(pathToOrganizationId.length)}`
}

/**
 *
 * @param listKey
 * @param pathToOrganizationId
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
const generateGqlQueryToOrganizationIdAsString = (listKey, pathToOrganizationId) => {
    if (!isString(listKey) || listKey.trim().length < 1) throw new Error('"listKey" must not be empty string!')
    if (!pathToOrganizationId || !isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" should not be empty array')

    return `
        query getAll${pluralize.plural(listKey)} ($where: ${listKey}WhereInput, $first: Int = 1) {
            objs: all${pluralize.plural(listKey)}(where: $where, first: $first) ${generateGqlDataPartToOrganizationId(pathToOrganizationId)}
        }
    `
}

/**
 *
 * @param pathToOrganizationId {string[]}
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
const generateGqlQueryToOrganizationId = memoize((schemaName, pathToOrganizationId) => {
    if (schemaName && (!isString(schemaName) || schemaName.trim().length < 1)) throw new Error(`"schemaName" should be not empty string! But was: "${schemaName}"`)
    if (!pathToOrganizationId || !isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" should not be empty array')
    if (pathToOrganizationId.length < 1) throw new Error(`To generate gql "pathToOrganizationId" must contain at least one elements! But was ${pathToOrganizationId}`)

    return gql`${generateGqlQueryToOrganizationIdAsString(schemaName, pathToOrganizationId)}`
})

/**
 *
 * @param pathToOrganizationId {string[]}
 * @param organizationIds {string[]}
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
const getFilterByOrganizationIds = (pathToOrganizationId, organizationIds) => {
    if (!isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" must be not empty array!')
    if (!isArray(organizationIds)) throw new Error('"organizationId" must be array!')

    if (pathToOrganizationId.length === 1) {
        return {
            [`${pathToOrganizationId[0]}_in`]: organizationIds,
            deletedAt: null,
        }
    }

    return {
        [pathToOrganizationId[0]]: getFilterByOrganizationIds(pathToOrganizationId.slice(1), organizationIds),
        deletedAt: null,
    }
}

module.exports = {
    getFilterByOrganizationIds,
    generateGqlQueryToOrganizationId,
    generateGqlDataPartToOrganizationId,
    generateGqlQueryToOrganizationIdAsString,
}
