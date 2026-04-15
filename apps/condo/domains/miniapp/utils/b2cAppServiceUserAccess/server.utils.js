const get = require('lodash/get')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const upperFirst = require('lodash/upperFirst')
const pluralize = require('pluralize')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find, getSchemaCtx, getByCondition } = require('@open-condo/keystone/schema')
const { nonNull } = require('@open-condo/miniapp-utils')

const { B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS } = require('@condo/domains/miniapp/utils/b2cAppServiceUserAccess/config')
const { generateGqlQueryToField, getFilterByFieldPathValue } = require('@condo/domains/miniapp/utils/serviceUserAccessUtils/helpers.utils')
const { SERVICE } = require('@condo/domains/user/constants/common')

function getB2CAppFilter ({ user, permissionKey, requirePermission }) {
    return {
        deletedAt: null,
        accessRights_some: {
            user: { id: user.id },
            deletedAt: null,
            ...(requirePermission 
                ? {
                    accessRightSet: {
                        [permissionKey]: true,
                        deletedAt: null,
                    },
                } 
                : null),
        },
    }
}

function isPathLeadsToB2CAppModel ({ pathToB2CAppId, listKey }) {
    if (!isString(listKey) || listKey.trim().length < 1) return false
    if (!isArray(pathToB2CAppId) || isEmpty(pathToB2CAppId)) return false

    const lastPathPart = pathToB2CAppId[pathToB2CAppId.length - 1]
    if (lastPathPart !== 'id') return false

    const pathToB2CApp = pathToB2CAppId.slice(0, -1)
    if (isEmpty(pathToB2CApp)) return listKey === 'B2CApp'

    let currentListKey = listKey
    for (const pathPart of pathToB2CApp) {
        if (!isString(pathPart) || pathPart.trim().length < 1) return false

        const schema = getSchemaCtx(currentListKey)
        const schemaFields = get(schema, 'list._fields', {})
        const ref = get(schemaFields, [pathPart, 'ref'], null)
        if (!isString(ref) || ref.trim().length < 1) return false

        const refListKey = ref.split('.')[0]
        if (!isString(refListKey) || refListKey.trim().length < 1) return false

        currentListKey = refListKey
    }

    return currentListKey === 'B2CApp'
}

/**
 * @return {Promise<Record<string, any>|false>}
 */
async function canReadByServiceUser (args, schemaConfig) {
    const { authentication: { item: user }, listKey } = args
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const pathToAddressKey = get(schemaConfig, 'pathToAddressKey', null)
    if (pathToAddressKey) {
        throw new Error('"pathToAddressKey" is not supported for read operations for now')
    }

    const pathToB2CAppId = get(schemaConfig, 'pathToB2CAppId', ['app', 'id'])
    if (!Array.isArray(pathToB2CAppId)) return false

    if (!isPathLeadsToB2CAppModel({ pathToB2CAppId, listKey, operation: 'read' })) return false

    const pathToB2CApp = pathToB2CAppId.slice(0, pathToB2CAppId.length - 1)
    if (!pathToB2CApp) return false

    const permissionKey = `canRead${pluralize.plural(listKey)}`

    return getFilterByFieldPathValue(pathToB2CApp, getB2CAppFilter({ user, requirePermission: !!schemaConfig.rightSetRequired, permissionKey }))
}

async function canManageByServiceUser ({ authentication: { item: user }, listKey, originalInput, itemId, itemIds, operation, context }, schemaConfig, parentSchemaName) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const originalInputs = Array.isArray(originalInput) ? originalInput.map(input => input.data) : [originalInput]

    const pathToAddressKey = get(schemaConfig, 'pathToAddressKey', null)
    if (pathToAddressKey) {
        throw new Error('"pathToAddressKey" is not supported for write operations for now')
    }

    const pathToB2CAppId = get(schemaConfig, 'pathToB2CAppId', ['app', 'id'])
    if (!Array.isArray(pathToB2CAppId)) return false

    let b2cAppIds = []

    if (operation === 'create') {
        if (pathToB2CAppId.length === 1) {
            b2cAppIds = originalInputs.map(input => get(input, pathToB2CAppId, null))
        }  else if (pathToB2CAppId.length === 2) {
            b2cAppIds = originalInputs.map(input => get(input, [pathToB2CAppId[0], 'connect', pathToB2CAppId[1]], null))
        } else if (pathToB2CAppId.length > 2) {
            const parentObjectIds = originalInputs
                .map(originalInput => get(originalInput, [pathToB2CAppId[0], 'connect', 'id'], null))
                .filter(nonNull)
            if (parentObjectIds.length !== originalInputs.length) return false

            const uniqueParentObjectIds = [...new Set(parentObjectIds)]

            const parentObjects = await execGqlWithoutAccess(context, {
                query: generateGqlQueryToField(parentSchemaName, pathToB2CAppId.slice(1)),
                variables: {
                    where: { id_in: uniqueParentObjectIds },
                    first: uniqueParentObjectIds.length,
                },
                dataPath: 'objs',
            })

            if (parentObjects.length !== uniqueParentObjectIds.length) return false

            b2cAppIds = parentObjects.map(parentObject => get(parentObject, pathToB2CAppId.slice(1), null))
        }
    } else if (operation === 'update') {
        const ids = itemIds || [itemId]
        if (!ids.length) return false

        const items = await find(listKey, {
            id_in: ids,
        })
        if (items.length !== ids.length) return false

        if (pathToB2CAppId.length === 1 || pathToB2CAppId.length === 2) {
            b2cAppIds = items.map(item => get(item, [pathToB2CAppId[0]], null))
        } else if (pathToB2CAppId.length > 2) {
            const parentObjectIds = items
                .map(item => get(item, [pathToB2CAppId[0]]))
                .filter(nonNull)

            if (parentObjectIds.length !== items.length) return false

            const uniqueParentObjectIds = [...new Set(parentObjectIds)]
            const parentObjects = await execGqlWithoutAccess(context, {
                query: generateGqlQueryToField(parentSchemaName, pathToB2CAppId.slice(1)),
                variables: {
                    where: { id_in: uniqueParentObjectIds },
                    first: uniqueParentObjectIds.length,
                },
                dataPath: 'objs',
            })

            if (parentObjects.length !== uniqueParentObjectIds.length) return false

            b2cAppIds = parentObjects.map(parentObject => get(parentObject, pathToB2CAppId.slice(1), null))
        }
    }

    if (!b2cAppIds.length) return false
    if (b2cAppIds.filter(nonNull).length !== b2cAppIds.length) return false

    const permissionKey = `canManage${pluralize.plural(listKey)}`

    const uniqueB2CAppIds = [...new Set(b2cAppIds)]
    const b2cApps = await find('B2CApp', {
        ...getB2CAppFilter({ user, requirePermission: !!schemaConfig.rightSetRequired, permissionKey }),
        id_in: uniqueB2CAppIds,
        deletedAt: null,
    })

    return b2cApps.length === uniqueB2CAppIds.length
}

async function canExecuteByServiceUser (params, serviceConfig) {
    const { authentication: { item: user }, args, gqlName } = params
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!gqlName) return false

    const pathToAddressKey = get(serviceConfig, 'pathToAddressKey', ['data', 'addressKey'])
    if (!Array.isArray(pathToAddressKey)) return false

    const addressKey = get(args, pathToAddressKey, null)
    if (!addressKey) return false

    const pathToB2CAppId = get(serviceConfig, 'pathToB2CApp', ['data', 'app', 'id'])
    if (!Array.isArray(pathToB2CAppId)) return false

    const b2cAppId = get(args, pathToB2CAppId, null)
    if (!b2cAppId) return false

    const permissionKey = `canExecute${upperFirst(gqlName)}`

    const b2cAppProperty = await getByCondition('B2CAppProperty', {
        deletedAt: null,
        addressKey,
        app: {
            ...getB2CAppFilter({ user, requirePermission: !!serviceConfig.rightSetRequired, permissionKey }),
            id: b2cAppId,
            deletedAt: null, 
        },
    })

    return !!b2cAppProperty
}

function isServiceUser ({ authentication: { item: user } }) {
    return get(user, 'type') === SERVICE
}

function getRefSchemaName (schemaConfig, listKey) {
    const pathToB2CApp = get(schemaConfig, 'pathToB2CAppId', ['app', 'id'])

    if (!isArray(pathToB2CApp) || isEmpty(pathToB2CApp)) {
        throw new Error('"pathToB2CAppId" must be not empty array!')
    }
    for (const pathPart of pathToB2CApp) {
        if (!isString(pathPart) || pathPart.trim().length < 1) {
            throw new Error(`"pathToB2CAppId" must contain array of string! But was: ${pathToB2CApp}`)
        }
    }

    const schema = getSchemaCtx(listKey)

    const schemaFields = get(schema, 'list._fields', {})
    return get(schemaFields, [pathToB2CApp[0], 'ref'], null)
}

async function canReadObjectsAsB2CAppServiceUser (args) {
    const { listKey } = args
    if (!isServiceUser(args)) return false
    const schemaConfig = get(B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.lists, listKey)
    if (!isObject(schemaConfig)) return false
    const canBeRead = get(schemaConfig, 'canBeRead', true)
    if (!canBeRead) return false
    return await canReadByServiceUser(args, schemaConfig)
}

async function canManageObjectsAsB2CAppServiceUser (args) {
    const { listKey } = args
    if (!isServiceUser(args)) return false
    const schemaConfig = get(B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.lists, listKey)
    if (!isObject(schemaConfig)) return false
    const canBeManaged = get(schemaConfig, 'canBeManaged', true)
    if (!canBeManaged) return false
    const refSchemaName = getRefSchemaName(schemaConfig, listKey)
    return await canManageByServiceUser(args, schemaConfig, refSchemaName)
}

async function canExecuteServiceAsB2CAppServiceUser (args) {
    const { info: { fieldName: serviceName } } = args
    if (!isServiceUser(args)) return false
    const serviceConfig = get(B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.services, serviceName)
    if (!isObject(serviceConfig)) return false
    return await canExecuteByServiceUser(args, serviceConfig)
}

module.exports = {
    canManageObjectsAsB2CAppServiceUser,
    canReadObjectsAsB2CAppServiceUser,
    canExecuteServiceAsB2CAppServiceUser,
}
