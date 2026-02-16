const get = require('lodash/get')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const upperFirst = require('lodash/upperFirst')
const pluralize = require('pluralize')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')

const { generateGqlQueryToOrganizationId, getFilterByOrganizationIds } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess/helpers.utils')
const { B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS } = require('@condo/domains/miniapp/utils/b2cAppServiceUserAccess/config')
const { SERVICE } = require('@condo/domains/user/constants/common')

/**
 * @return {Promise<Record<string, any>|false>}
 */
const canReadByServiceUser = async ({ authentication: { item: user }, args, listKey, context }, schemaConfig) => {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const pathToB2CAppPropertyAddressKey = get(schemaConfig, 'pathToB2CAppPropertyAddressKey')
    if (!pathToB2CAppPropertyAddressKey) return false

    const permissionKey = `canRead${pluralize.plural(listKey)}`

    const B2CAppProperties = await find('B2CAppProperty', {
        app: {
            deletedAt: null,
            accessRights_some: {
                user: { id: user.id },
                deletedAt: null,
                accessRightSet: {
                    [permissionKey]: true,
                    deletedAt: null,
                },
            },
        },
        deletedAt: null,
    })

    const b2cAppPropertyAddressKeys = B2CAppProperties
        // Maybe need to check for property availability (virtual, needs calculations here)
        //.filter(b2cAppProperty => b2cAppProperty.isAvailable)
        .map(ctx => ctx.addressKey)

    if (!b2cAppPropertyAddressKeys || isEmpty(b2cAppPropertyAddressKeys)) return false

    // NOTE(YEgorLu): "getFilterByOrganizationIds" in fact can be called "getFilterBy", finds any field by path
    return getFilterByOrganizationIds(pathToB2CAppPropertyAddressKey, b2cAppPropertyAddressKeys)
}

const canManageByServiceUser = async ({ authentication: { item: user }, listKey, originalInput, itemId, operation, context }, schemaConfig, parentSchemaName) => {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const isBulkRequest = Array.isArray(originalInput)

    if (isBulkRequest) return false

    const pathToB2CAppPropertyAddressKey = get(schemaConfig, 'pathToB2CAppPropertyAddressKey')

    if (!pathToB2CAppPropertyAddressKey) return false

    let addressKey

    if (operation === 'create') {
        // addressKey is present in schema we want to change
        if (pathToB2CAppPropertyAddressKey.length === 1) {
            // NOTE(YEgorLu): We don't have "addressKey" until we pass access check and call address-service
            //                What we maybe can do is:
            //                1) Call address-service here anyway, maybe provide some value so inner addressService plugin will not make duplicate call
            //                2) Somehow let addressService plugin know that we need to check "addressKey" and basically move this check in it
            //                3) Just let to create anything, user just would not be able to see entity if made it wrong
            //                4) Search B2CAppProperties by "address". This way "address" must be normalized just before call, but potentially we may be having 2 similar addresses (addressKey is same, address differs a little, so no access when it should be)
            return false
        // addressKey is present in already created relationship
        } else if (pathToB2CAppPropertyAddressKey.length > 1) {
            const parentObjectId = get(originalInput, [pathToB2CAppPropertyAddressKey[0], 'connect', 'id'], null)
            if (!parentObjectId) return false

            // NOTE(YEgorLu): "generateGqlQueryToOrganizationId" in fact makes query to any needed field
            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGqlQueryToOrganizationId(parentSchemaName, pathToB2CAppPropertyAddressKey.slice(1)),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            addressKey = get(parentObject, pathToB2CAppPropertyAddressKey.slice(1))
        }
    } else if (operation === 'update') {
        if (!itemId) return false

        const item = await getById(listKey, itemId)
        if (!item) return false

        if (pathToB2CAppPropertyAddressKey.length === 1) {
            addressKey = get(item, [pathToB2CAppPropertyAddressKey[0]], null)
        } else if (pathToB2CAppPropertyAddressKey.length > 1) {
            const parentObjectId = get(item, [pathToB2CAppPropertyAddressKey[0]])
            if (!parentObjectId) return false

            // NOTE(YEgorLu): "generateGqlQueryToOrganizationId" in fact makes query to any needed field
            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGqlQueryToOrganizationId(parentSchemaName, pathToB2CAppPropertyAddressKey.slice(1)),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            addressKey = get(parentObject, pathToB2CAppPropertyAddressKey.slice(1))
        }
    }

    if (!addressKey) return false

    const permissionKey = `canManage${pluralize.plural(listKey)}`

    const B2CAppProperties = await find('B2CAppProperty', {
        addressKey: addressKey,
        app: {
            deletedAt: null,
            accessRights_some: {
                user: { id: user.id },
                deletedAt: null,
                accessRightSet: {
                    [permissionKey]: true,
                    deletedAt: null,
                },
            },
        },
        deletedAt: null,
    })

    // Maybe need to check for property availability (virtual, needs calculations here)
    //return !isEmpty(B2CAppProperties.filter(b2cAppProperty => b2cAppProperty.isAvailable))
    return !isEmpty(B2CAppProperties)
}

const canExecuteByServiceUser = async (params, serviceConfig) => {
    const { authentication: { item: user }, args, gqlName } = params
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!gqlName) return false

    const pathToB2CAppPropertyAddressKey = get(serviceConfig, 'pathToB2CAppPropertyAddressKey')
    if (!pathToB2CAppPropertyAddressKey) return false

    const b2cAppPropertyAddressKey = get(args, pathToB2CAppPropertyAddressKey, null)
    if (!b2cAppPropertyAddressKey) return false

    const permissionKey = `canExecute${upperFirst(gqlName)}`

    const B2CAppProperties = await find('B2CAppProperty', {
        addressKey: b2cAppPropertyAddressKey,
        app: {
            deletedAt: null,
            accessRights_some: {
                user: { id: user.id },
                deletedAt: null,
                accessRightSet: {
                    [permissionKey]: true,
                    deletedAt: null,
                },
            },
        },
        deletedAt: null,
    })

    // Maybe need to check for property availability (virtual, needs calculations here)
    // return !isEmpty(B2CAppProperties.filter(b2cAppProperty => b2cAppProperty.isAvailable))
    return !isEmpty(B2CAppProperties)
}

const isServiceUser = ({ authentication: { item: user } }) => {
    return get(user, 'type') === SERVICE
}

const getRefSchemaName = (schemaConfig, listKey) => {
    const pathToAddressKey = get(schemaConfig, 'pathToB2CAppPropertyAddressKey', null)

    if (!isArray(pathToAddressKey) || isEmpty(pathToAddressKey)) {
        throw new Error('"pathToB2CAppPropertyAddressKey" must be not empty array!')
    }
    for (const pathPart of pathToAddressKey) {
        if (!isString(pathPart) || pathPart.trim().length < 1) {
            throw new Error(`"pathToB2CAppPropertyAddressKey" must contain array of string! But was: ${pathToAddressKey}`)
        }
    }

    const schema = getSchemaCtx(listKey)

    const schemaFields = get(schema, 'list._fields', {})
    return get(schemaFields, [pathToAddressKey[0], 'ref'], null)
}

/**
 * Checks that service user can read objects of organization that is connected to linked B2B app
 *
 * @param args
 * @return {Promise<Record<string, any>|false>}
 */
const canReadObjectsAsB2CAppServiceUser = async (args) => {
    const { listKey } = args
    if (!isServiceUser(args)) return false
    const schemaConfig = get(B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.lists, listKey)
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
const canManageObjectsAsB2CAppServiceUser = async (args) => {
    const { listKey } = args
    if (!isServiceUser(args)) return false
    const schemaConfig = get(B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.lists, listKey)
    if (!isObject(schemaConfig)) return false
    const canBeManaged = get(schemaConfig, 'canBeManaged', true)
    if (!canBeManaged) return false
    const refSchemaName = getRefSchemaName(schemaConfig, listKey)
    return await canManageByServiceUser(args, schemaConfig, refSchemaName) // todo: @toplenboren create a test with offline token for only one organization
}

const canExecuteServiceAsB2CAppServiceUser = async (args) => {
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
