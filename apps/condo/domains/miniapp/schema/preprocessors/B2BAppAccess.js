const { getType } = require('@keystonejs/utils')
const { gql } = require('graphql-tag')
const { isBoolean, isObject, isEmpty, isFunction, get, isArray, set } = require('lodash')
const pluralize = require('pluralize')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { evaluateKeystoneAccessResult } = require('@open-condo/keystone/plugins/utils')
const { GQL_LIST_SCHEMA_TYPE, find, getById } = require('@open-condo/keystone/schema')


function fieldAccessWrapperIfNeeded (access, fnWrapper) {
    // NOTE: you can use the same object in many places! you don't need to wrap it twice
    if (!fnWrapper.alreadyprocessedbyb2bappaccessplugin) fnWrapper.alreadyprocessedbyb2bappaccessplugin = true

    const type = getType(access)
    if (type === 'Boolean') {
        // No need to wrap! You already have access, or you should not have it anyway!
        return access
    } else if (type === 'Function') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbyb2bappaccessplugin) return access
        else return fnWrapper
    } else if (type === 'AsyncFunction') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbyb2bappaccessplugin) return access
        else return fnWrapper
    } else if (type === 'Object') {
        const newAccess = {}
        if (typeof access.read !== 'undefined') newAccess.read = fieldAccessWrapperIfNeeded(access.read, fnWrapper)
        if (typeof access.create !== 'undefined') newAccess.create = fieldAccessWrapperIfNeeded(access.create, fnWrapper)
        if (typeof access.update !== 'undefined') newAccess.update = fieldAccessWrapperIfNeeded(access.update, fnWrapper)
        if (typeof access.delete !== 'undefined') newAccess.delete = fieldAccessWrapperIfNeeded(access.delete, fnWrapper)
        if (typeof access.auth !== 'undefined') newAccess.auth = fieldAccessWrapperIfNeeded(access.auth, fnWrapper)
        return newAccess
    }

    throw new Error(
        `fieldAccessWrapperIfNeeded(), received ${type}.`,
    )
}

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

const GENERATED_SCHEMAS = new Map()

/**
 *
 * @param pathToOrganizationId {string[]}
 * @return {*|DocumentNode}
 *
 * @example
 * Input: ['ticket', 'organization', 'id']
 * Output: gql`
 *         query getAllTickets ($where: TicketWhereInput, $first: Int = 1) {
 *             objs: allTickets(where: $where, first: $first) { organization { id } }
 *         }
 *     `
 */
const generateGql = (pathToOrganizationId) => {
    if (!pathToOrganizationId || !isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) throw new Error('"pathToOrganizationId" should not be empty array')
    if (pathToOrganizationId.length < 3) throw new Error()

    const gqlKey = pathToOrganizationId.join(':')

    if (GENERATED_SCHEMAS.has(gqlKey)) {
        return GENERATED_SCHEMAS.get(gqlKey)
    }

    const listKey = pathToOrganizationId[0].charAt(0).toUpperCase() + pathToOrganizationId[0].slice(1)

    const generatedGql = gql`
        query getAll${pluralize.plural(listKey)} ($where: ${listKey}WhereInput, $first: Int = 1) {
            objs: all${pluralize.plural(listKey)}(where: $where, first: $first) ${generateGqlDataPart(pathToOrganizationId.slice(1))}
        }
    `
    GENERATED_SCHEMAS.set(gqlKey, generatedGql)

    return generatedGql
}

const canManageByServiceUser = async ({ authentication: { item: user }, listKey, originalInput, itemId, operation, context }, schemaConfig) => {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const pathToOrganizationId = get(schemaConfig, 'pathToOrganizationId', ['organization', 'id'])

    let organizationId

    if (operation === 'create') {
        if (pathToOrganizationId.length === 1) {
            // NOTE: This is the case with the scheme "Organization".
            //       Service user cannot manage someone else's organization
            return false
        } else if (pathToOrganizationId.length === 2) {
            organizationId = get(originalInput, [pathToOrganizationId[0], 'connect', pathToOrganizationId[1]], null)
        } else if (pathToOrganizationId.length === 3) {
            const parentObjectId = get(originalInput, [pathToOrganizationId[0], 'connect', 'id'], null)
            if (!parentObjectId) return false

            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGql(pathToOrganizationId),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            organizationId = get(parentObject, [pathToOrganizationId[1], pathToOrganizationId[2]])
        } else {
            throw new Error(`you should implement "canManageByServiceUser" when "pathToOrganizationId" have depth ${pathToOrganizationId.length}`)
        }
    } else if (operation === 'update') {
        const item = await getById(listKey, itemId)
        if (!item) return false

        if (pathToOrganizationId.length === 1) {
            // NOTE: This is the case with the scheme "Organization".
            //       Service user cannot manage someone else's organization
            return false
        } else if (pathToOrganizationId.length === 2) {
            organizationId = get(item, [pathToOrganizationId[0]], null)
        } else if (pathToOrganizationId.length === 3) {
            const parentObjectId = get(item, [pathToOrganizationId[0]])
            if (!parentObjectId) return false

            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGql(pathToOrganizationId),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            organizationId = get(parentObject, [pathToOrganizationId[1], pathToOrganizationId[2]])
        } else {
            throw new Error(`you should implement "canManageByServiceUser" when "pathToOrganizationId" have depth ${pathToOrganizationId.length}`)
        }
    }

    if (!organizationId) return false

    const B2BAppContexts = await find('B2BAppContext', {
        organization: { id: organizationId, deletedAt: null },
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

    return !isEmpty(B2BAppContexts)
}

/**
 *
 * @param pathToOrganizationId {string[]}
 * @param organizationId {string}
 * @return {{[p: string]: *, deletedAt: null}|{[p: number]: {deletedAt: null}|{deletedAt: null}, deletedAt: null}}
 *
 * @example
 * Input: (['ticket', 'organization', 'id'], 'cdcbf4f8-a5b2-4831-bfb0-354a0abe0aa3')
 * Output: {
 *     ticket: {
 *         organization: {
 *             id: 'cdcbf4f8-a5b2-4831-bfb0-354a0abe0aa3',
 *             deletedAt, null,
 *         },
 *         deletedAt, null,
 *     },
 *     deletedAt, null,
 * }
 */
const getFilter = (pathToOrganizationId, organizationId) => {
    if (!pathToOrganizationId || isEmpty(pathToOrganizationId)) throw new Error('no pathToOrganizationId!')
    if (!organizationId) throw new Error('no organizationId!')

    if (pathToOrganizationId.length === 1) {
        return {
            [`${pathToOrganizationId[0]}_in`]: organizationId,
            deletedAt: null,
        }
    }

    return {
        [pathToOrganizationId[0]]: getFilter(pathToOrganizationId.slice(1), organizationId),
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

const PERMISSION_FIELD = {
    type: 'Checkbox',
    defaultValue: false,
    kmigratorOptions: { default: false },
    access: {
        read: true,
        create: true,
        update: false,
    },
}

const CAN_MANAGE_ORGANIZATION_FIELD = {
    ...PERMISSION_FIELD,
    schemaDoc: 'Currently, creating and editing organizations is prohibited regardless of the specified value',
}

const addPermissionFieldsToSchema = (schema, schemaName) => {
    if (ALL_PERMISSION_NAMES.size < 1) {
        throw new Error('have not permissions')
    }

    const fields = get(schema, 'fields')

    if (!fields || !isObject(fields)) {
        throw new Error(`${schemaName} has not fields`)
    }

    const allPermissions = Array.from(ALL_PERMISSION_NAMES)
    const fieldNames = Object.keys(fields)
    for (const fieldName of fieldNames) {
        if (allPermissions.includes(fieldName)) {
            throw new Error(`schema "${schemaName}" have field with name "${fieldName}" yet`)
        }
    }

    for (const permissionFieldName of allPermissions) {
        set(schema.fields, [permissionFieldName], {
            ...(permissionFieldName === 'canManageOrganizations' ? CAN_MANAGE_ORGANIZATION_FIELD : PERMISSION_FIELD),
        })
    }
}

const addCustomAccessToSchema = (schema, schemaConfig) => {
    const access = schema.access

    const customListAccess = async (args) => {
        const { operation, authentication: { item: user } } = args

        const isServiceUser = get(user, 'type') === 'service'

        if (isServiceUser) {
            if (operation === 'read') {
                const defaultAccess = await evaluateKeystoneAccessResult(access, operation, args)

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
                    || await canManageByServiceUser(args, schemaConfig)
            }
        }

        return await evaluateKeystoneAccessResult(access, operation, args)
    }

    schema.access = fieldAccessWrapperIfNeeded(access, customListAccess)
}

const ALL_PERMISSION_NAMES = new Set()

/**
 *
 * Determines whether to add permissions for the model with the specified name
 *
 * @callback shouldCreatePermissionsForSchema
 * @param {string} schemaName
 * @returns {boolean}
 */

/**
 *
 * Overrides the plugin's default behavior for the specified schema
 *
 * @typedef {Object} B2BAppAccessConfig
 * @property {Array.<string>} pathToOrganizationId - Way to get the organization id
 */

/**
 *
 * Overrides the plugin's default behavior for the specified schema
 *
 * @example Overrides for Organization schema
 * {
 *    Organization: {
 *       // Default value ['organization', 'id'] => get value from <SchemaName>.organization.id
 *       // But for the Organization scheme get value from <SchemaName>.id
 *       pathToOrganizationId: ['id'],
 *    },
 * }
 *
 * @typedef {Object.<string, B2BAppAccessConfig>} B2BAppAccessConfigBySchemaName
 */

/**
 *
 * This plugin solves the following problem: from the miniapp on behalf of the service user it is impossible to receive data of organizations connected to this miniapp.
 *
 * --
 *
 * What happens in the plugin?
 *
 * 1) In schemes that are somehow connected with the organization scheme, we add a custom access. What is it checking?
 *
 *      1.1) Request on behalf of service user
 *
 *      1.2)The organization is connected to miniapp A (have B2BAppContext)
 *
 *      1.3) Service user connected to miniapp A (have B2BAppAccessRight)
 *
 *      1.4) In the scheme B2BAppAccessRight for the miniapp A the necessary rights were issued to execute the request
 *
 * 2) In scheme B2BAppAccessRight we add the fields canRead... and canManage... for the necessary schemes.
 *
 * @param {shouldCreatePermissionsForSchema} shouldCreatePermissionsForSchema - Determines whether to add permissions for the model with the specified name
 * @param {B2BAppAccessConfigBySchemaName} config - Overrides the plugin's default behavior for the specified schema
 * @param {string} targetSchemaNameWithPermissions - The name of the scheme to which the permissions fields will be added
 */
const B2BAppAccess = (shouldCreatePermissionsForSchema, config = {}, targetSchemaNameWithPermissions = 'B2BAppAccessRight') => {
    if (!targetSchemaNameWithPermissions) throw new Error('no targetSchemaNameWithPermissions!')
    if (!shouldCreatePermissionsForSchema || !isFunction(shouldCreatePermissionsForSchema)) throw new Error('"shouldCreatePermissionsForSchema" is not function')
    if (!isObject(config)) throw new Error('config not object!')

    return (schemaType, schemaName, schema) => {
        if (schemaType !== GQL_LIST_SCHEMA_TYPE || schemaName.endsWith('HistoryRecord')) return schema

        if (schemaName === targetSchemaNameWithPermissions) {
            addPermissionFieldsToSchema(schema, schemaName)
            return schema
        }

        if (!shouldCreatePermissionsForSchema(schemaName)) return schema

        const schemaConfig = get(config, schemaName, {})

        if (!Object.keys(get(schema, 'fields', {})).includes('organization') && !get(schemaConfig, 'pathToOrganizationId')) {
            throw new Error(`schema "${schemaName}" has not field "organization"`)
        }

        addCustomAccessToSchema(schema, schemaConfig)

        const canReadName = `canRead${pluralize.plural(schemaName)}`
        const canManageName = `canManage${pluralize.plural(schemaName)}`

        if (ALL_PERMISSION_NAMES.has(canReadName)) {
            throw new Error(`${canReadName} have yet`)
        }
        if (ALL_PERMISSION_NAMES.has(canManageName)) {
            throw new Error(`${canManageName} have yet`)
        }

        ALL_PERMISSION_NAMES.add(canReadName)
        ALL_PERMISSION_NAMES.add(canManageName)

        return schema
    }
}

module.exports = {
    B2BAppAccess,
}
