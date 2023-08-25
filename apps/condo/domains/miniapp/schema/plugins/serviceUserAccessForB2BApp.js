const { gql } = require('graphql-tag')
const { get, isArray, isEmpty, isString, isBoolean, isObject } = require('lodash')
const pluralize = require('pluralize')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { evaluateKeystoneAccessResult } = require('@open-condo/keystone/plugins/utils')
const { GQL_SCHEMA_PLUGIN } = require('@open-condo/keystone/plugins/utils/typing')
const { find, getById } = require('@open-condo/keystone/schema')


const ALL_GENERATED_GQL_QUERIES = new Map()


/**
 *
 * @param pathToOrganizationId {string[]}
 * @return {string}
 *
 * @example
 * Input: ['a', 'b', 'c']
 * Output: '{ a { b { c } } }'
 */
const generateGqlDataPart = (pathToOrganizationId) => {
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
const generateGqlQueryAsString = (listKey, pathToOrganizationId) => {
    if (!isString(listKey) || listKey.trim().length < 1) throw new Error('"listKey" must not be empty string!')
    if (!pathToOrganizationId || !isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" should not be empty array')

    return `
        query getAll${pluralize.plural(listKey)} ($where: ${listKey}WhereInput, $first: Int = 1) {
            objs: all${pluralize.plural(listKey)}(where: $where, first: $first) ${generateGqlDataPart(pathToOrganizationId)}
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
const generateGqlQuery = (schemaName, pathToOrganizationId) => {
    if (schemaName && (!isString(schemaName) || schemaName.trim().length < 1)) throw new Error(`"customListKey" should be not empty string! But was: "${schemaName}"`)
    if (!pathToOrganizationId || !isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" should not be empty array')
    if (pathToOrganizationId.length < 1) throw new Error(`To generate gql "pathToOrganizationId" must contain at least one elements! But was ${pathToOrganizationId}`)

    const gqlKey = [schemaName, ...pathToOrganizationId].join(':')

    // get already generated gql query to reuse them
    if (ALL_GENERATED_GQL_QUERIES.has(gqlKey)) {
        return ALL_GENERATED_GQL_QUERIES.get(gqlKey)
    }

    const generatedGql = gql`${generateGqlQueryAsString(schemaName, pathToOrganizationId)}`

    // save generated gql query to reuse them
    ALL_GENERATED_GQL_QUERIES.set(gqlKey, generatedGql)

    return generatedGql
}

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
const getFilter = (pathToOrganizationId, organizationIds) => {
    if (!isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" must be not empty array!')
    if (!isArray(organizationIds)) throw new Error('"organizationId" must be array!')

    if (pathToOrganizationId.length === 1) {
        return {
            [`${pathToOrganizationId[0]}_in`]: organizationIds,
            deletedAt: null,
        }
    }

    return {
        [pathToOrganizationId[0]]: getFilter(pathToOrganizationId.slice(1), organizationIds),
        deletedAt: null,
    }
}

const canReadByServiceUser = async ({ authentication: { item: user }, args, listKey }, schemaConfig) => {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const pathToOrganizationId = get(schemaConfig, 'pathToOrganizationId', ['organization', 'id'])

    const B2BAppContexts = await find('B2BAppContext', {
        organization: { deletedAt: null },
        app: {
            accessRights_some: {
                accessRightSet: {
                    [`canRead${pluralize.plural(listKey)}`]: true,
                    deletedAt: null,
                },
                user: { id: user.id, type: 'service', deletedAt: null },
                deletedAt: null,
            },
            deletedAt: null,
        },
        status: 'Finished',
        deletedAt: null,
    })

    const organizationIds = B2BAppContexts.map(ctx => ctx.organization)

    if (!organizationIds || isEmpty(organizationIds)) return false

    return getFilter(pathToOrganizationId, organizationIds)
}

const canManageByServiceUser = async ({ authentication: { item: user }, listKey, originalInput, itemId, operation, context }, schemaConfig, parentSchemaName) => {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const isBulkRequest = Array.isArray(originalInput)

    if (isBulkRequest) return false

    const pathToOrganizationId = get(schemaConfig, 'pathToOrganizationId', ['organization', 'id'])
    if (!isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) return false

    let organizationId

    if (operation === 'create') {
        if (pathToOrganizationId.length === 1) {
            organizationId = get(originalInput, [pathToOrganizationId[0]], null)
        } else if (pathToOrganizationId.length === 2) {
            organizationId = get(originalInput, [pathToOrganizationId[0], 'connect', pathToOrganizationId[1]], null)
        } else if (pathToOrganizationId.length > 2) {
            const parentObjectId = get(originalInput, [pathToOrganizationId[0], 'connect', 'id'], null)
            if (!parentObjectId) return false

            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGqlQuery(parentSchemaName, pathToOrganizationId.slice(1)),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            organizationId = get(parentObject, pathToOrganizationId.slice(1))
        }
    } else if (operation === 'update') {
        if (!itemId) return false

        const item = await getById(listKey, itemId)
        if (!item) return false

        if (pathToOrganizationId.length === 1 || pathToOrganizationId.length === 2) {
            organizationId = get(item, [pathToOrganizationId[0]], null)
        } else if (pathToOrganizationId.length > 2) {
            const parentObjectId = get(item, [pathToOrganizationId[0]])
            if (!parentObjectId) return false

            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGqlQuery(parentSchemaName, pathToOrganizationId.slice(1)),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            organizationId = get(parentObject, pathToOrganizationId.slice(1))
        }
    }

    if (!organizationId) return false

    const B2BAppContexts = await find('B2BAppContext', {
        organization: { id: organizationId, deletedAt: null },
        app: {
            accessRights_some: {
                accessRightSet: {
                    [`canManage${pluralize.plural(listKey)}`]: true,
                    deletedAt: null,
                },
                user: { id: user.id, type: 'service', deletedAt: null },
                deletedAt: null,
            },
            deletedAt: null,
        },
        status: 'Finished',
        deletedAt: null,
    })

    return !isEmpty(B2BAppContexts)
}

function plugin (fn) {
    fn._type = GQL_SCHEMA_PLUGIN
    return fn
}

/**
 *
 * This plugin solves the following problem: from the miniapp on behalf of the service user it is impossible to receive data of organizations connected to this miniapp.
 * ---
 *
 * What happens in the plugin?
 *
 * 1) In schemes that are somehow connected with the organization scheme, we add a custom access. What is it checking?
 *
 *      1.1) Request on behalf of service user
 *
 *      1.2) The organization is connected to B2BApp A (have B2BAppContext)
 *
 *      1.3) Service user connected to B2BApp A (have B2BAppAccessRight)
 *
 *      1.4) B2BAppAccessRightSet connected to B2BAppAccessRight
 *
 *      1.5) In the scheme B2BAppAccessRightSet for the B2BApp A the necessary rights were issued to execute the request
 *
 * @param {B2BAppAccessConfig} schemaConfig - Overrides the plugin's default behavior for the specified schema
 */
const serviceUserAccessForB2BApp = ({ schemaConfig }) => plugin((schema, { schemaName }) => {
    const pathToOrganizationId = get(schemaConfig, 'pathToOrganizationId', ['organization', 'id'])

    if (!isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) {
        throw new Error('"pathToOrganizationId" must be not empty array!')
    }
    for (const pathPart of pathToOrganizationId) {
        if (!isString(pathPart) || pathPart.trim().length < 1) {
            throw new Error(`"pathToOrganizationId" must contain array of string! But was: ${pathToOrganizationId}`)
        }
    }

    const schemaFields = get(schema, 'fields', {})
    const refSchemaName = get(schemaFields, [pathToOrganizationId[0], 'ref'], null)

    if (!Object.keys(schemaFields).includes('organization') && !get(schemaConfig, 'pathToOrganizationId')) {
        throw new Error(`Schema "${schemaName}" has not field "organization"`)
    }
    if (pathToOrganizationId.length > 1 && !refSchemaName) {
        throw new Error(`not found "ref" for "${pathToOrganizationId[0]}" field in "${schemaName}" schema`)
    }

    const access = get(schema, 'access')

    if (!access) {
        throw new Error(`Schema "${schemaName}" has not access!`)
    }

    const canBeRead = get(schemaConfig, 'canBeRead', true)
    const canBeManage = get(schemaConfig, 'canBeManage', true)

    const customListAccess = async (args) => {
        const { operation, authentication: { item: user } } = args

        const isServiceUser = get(user, 'type') === 'service'

        if (isServiceUser) {
            if (operation === 'read') {
                const defaultAccess = await evaluateKeystoneAccessResult(access, operation, args)

                if (!canBeRead) return defaultAccess
                if (isBoolean(defaultAccess)) return defaultAccess
                if (isObject(defaultAccess) && isEmpty(defaultAccess)) return defaultAccess

                const customAccess = await canReadByServiceUser(args, schemaConfig)
                if (customAccess === true) return customAccess
                if (customAccess === false) return defaultAccess

                return {
                    OR: [
                        { AND: [defaultAccess] },
                        { AND: [customAccess] },
                    ],
                }
            } else if ((operation === 'create' || operation === 'update')) {
                return await evaluateKeystoneAccessResult(access, operation, args)
                    || (canBeManage && await canManageByServiceUser(args, schemaConfig, refSchemaName))
            }
        }

        return await evaluateKeystoneAccessResult(access, operation, args)
    }

    schema.access = customListAccess

    return schema
})

module.exports = {
    serviceUserAccessForB2BApp,
    generateGqlDataPart,
    generateGqlQueryAsString,
    getFilter,
}
