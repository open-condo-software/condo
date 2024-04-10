const { isObject, isEmpty, get, isArray, isString, upperFirst } = require('lodash')
const pluralize = require('pluralize')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')

const { B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess/config')
const { SERVICE } = require('@condo/domains/user/constants/common')

const { generateGqlQueryToOrganizationId, getFilterByOrganizationIds } = require('./helpers.utils')


/**
 * @return {Promise<Record<string, any>|false>}
 */
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

    return getFilterByOrganizationIds(pathToOrganizationId, organizationIds)
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
                query: generateGqlQueryToOrganizationId(parentSchemaName, pathToOrganizationId.slice(1)),
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
                query: generateGqlQueryToOrganizationId(parentSchemaName, pathToOrganizationId.slice(1)),
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

const canExecuteByServiceUser = async (params, serviceConfig) => {
    const { authentication: { item: user }, args, gqlName } = params

    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!gqlName) return false

    const pathToOrganizationId = get(serviceConfig, 'pathToOrganizationId', ['data', 'organization', 'id'])
    if (!isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) return false

    let organizationId = get(args, pathToOrganizationId)

    if (!organizationId) return false

    const B2BAppContexts = await find('B2BAppContext', {
        organization: { id: organizationId, deletedAt: null },
        app: {
            accessRights_some: {
                accessRightSet: {
                    [`canExecute${upperFirst(fieldName)}`]: true,
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

const isServiceUser = ({ authentication: { item: user } }) => {
    return get(user, 'type') === SERVICE
}

const getRefSchemaName = (schemaConfig, listKey) => {
    const pathToOrganizationId = get(schemaConfig, 'pathToOrganizationId', ['organization', 'id'])

    if (!isArray(pathToOrganizationId) || isEmpty(pathToOrganizationId)) {
        throw new Error('"pathToOrganizationId" must be not empty array!')
    }
    for (const pathPart of pathToOrganizationId) {
        if (!isString(pathPart) || pathPart.trim().length < 1) {
            throw new Error(`"pathToOrganizationId" must contain array of string! But was: ${pathToOrganizationId}`)
        }
    }

    const schema = getSchemaCtx(listKey)

    const schemaFields = get(schema, 'list._fields', {})
    return get(schemaFields, [pathToOrganizationId[0], 'ref'], null)
}

/**
 * Checks that service user can read objects of organization that is connected to linked B2B app
 *
 * @param args
 * @return {Promise<Record<string, any>|false>}
 */
const canReadObjectsAsB2BAppServiceUser = async (args) => {
    const { listKey } = args
    if (!isServiceUser(args)) return false
    const schemaConfig = get(B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.lists, listKey)
    if (!isObject(schemaConfig)) return false
    const canBeRead = get(schemaConfig, 'canBeRead', true)
    if (!canBeRead) return false
    return await canReadByServiceUser(args, schemaConfig)
}

/**
 * Checks that service user can manage objects of organization that is connected to linked B2B app
 *
 * @param args
 * @return {Promise<boolean>}
 */
const canManageObjectsAsB2BAppServiceUser = async (args) => {
    const { listKey } = args
    if (!isServiceUser(args)) return false
    const schemaConfig = get(B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.lists, listKey)
    if (!isObject(schemaConfig)) return false
    const canBeManaged = get(schemaConfig, 'canBeManaged', true)
    if (!canBeManaged) return false
    const refSchemaName = getRefSchemaName(schemaConfig, listKey)
    return await canManageByServiceUser(args, schemaConfig, refSchemaName)
}

const canExecuteServiceAsB2BAppServiceUser = async (args) => {
    const { info: { fieldName: serviceName } } = args
    if (!isServiceUser(args)) return false
    const serviceConfig = get(B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.services, serviceName)
    if (!isObject(serviceConfig)) return false
    return await canExecuteByServiceUser(args, serviceConfig)
}

module.exports = {
    canManageObjectsAsB2BAppServiceUser,
    canReadObjectsAsB2BAppServiceUser,
    canExecuteServiceAsB2BAppServiceUser,
}
