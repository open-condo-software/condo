const get = require('lodash/get')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const upperFirst = require('lodash/upperFirst')
const pluralize = require('pluralize')

const {
    createInstance: createAddressServiceClientInstance,
} = require('@open-condo/clients/address-service-client')
const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')

const { B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS } = require('@condo/domains/miniapp/utils/b2cAppServiceUserAccess/config')
const { generateGqlQueryToField, getFilterByFieldPathValues } = require('@condo/domains/miniapp/utils/serviceUserAccessUtils/helpers.utils')
const { SERVICE } = require('@condo/domains/user/constants/common')

async function fetchAddressKey (address) {
    try {
        const client = createAddressServiceClientInstance()
        const result = await client.search(address)
        return get(result, 'addressKey', null)
    } catch (error) {
        return null
    }
}

/**
 * @return {Promise<Record<string, any>|false>}
 */
async function canReadByServiceUser ({ authentication: { item: user }, args, listKey, context }, schemaConfig) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const pathToAddressKey = get(schemaConfig, 'pathToAddressKey')
    if (!pathToAddressKey) return false

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

    return getFilterByFieldPathValues(pathToAddressKey, b2cAppPropertyAddressKeys)
}

async function canManageByServiceUser ({ authentication: { item: user }, listKey, originalInput, itemId, operation, context }, schemaConfig, parentSchemaName) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!listKey) return false

    const isBulkRequest = Array.isArray(originalInput)

    if (isBulkRequest) return false

    const pathToAddressKey = get(schemaConfig, 'pathToAddressKey')
    const pathToAddress = get(schemaConfig, 'pathToAddress')

    if (!pathToAddressKey) return false

    let addressKey

    if (operation === 'create') {
        // addressKey is present in schema we want to change
        if (pathToAddressKey.length === 1) {
            // NOTE(YEgorLu): We don't have "addressKey" until we pass access check and call address-service
            //                What we maybe can do is:
            //                1) Call address-service here anyway, maybe provide some value so inner addressService plugin will not make duplicate call
            //                X) Somehow let addressService plugin know that we need to check "addressKey" and basically move this check in it
            //                X) Just let to create anything, user just would not be able to see entity if made it wrong
            //                X) Search B2CAppProperties by "address". This way "address" must be normalized just before call, but potentially we may be having 2 similar addresses (addressKey is same, address differs a little, so no access when it should be)
            //
            //  Decided to go with option 1). But just call address-service. Later we can make optimizations like exclude duplicate calls, search only in database and not in provider (if no addressKey in database, then B2CAppProperty does not exist anyway and no access)
            if (!pathToAddress) return false
            const address = get(originalInput, pathToAddress, null)
            if (!address) return false

            addressKey = await fetchAddressKey()
        // addressKey is present in already created relationship
        } else if (pathToAddressKey.length > 1) {
            const parentObjectId = get(originalInput, [pathToAddressKey[0], 'connect', 'id'], null)
            if (!parentObjectId) return false

            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGqlQueryToField(parentSchemaName, pathToAddressKey.slice(1)),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            addressKey = get(parentObject, pathToAddressKey.slice(1))
        }
    } else if (operation === 'update') {
        if (!itemId) return false // NOTE(YEgorLu): maybe add support for bulk requests later

        const item = await getById(listKey, itemId)
        if (!item) return false

        if (pathToAddressKey.length === 1) {
            addressKey = get(item, [pathToAddressKey[0]], null)
        } else if (pathToAddressKey.length > 1) {
            const parentObjectId = get(item, [pathToAddressKey[0]])
            if (!parentObjectId) return false

            const [parentObject] = await execGqlWithoutAccess(context, {
                query: generateGqlQueryToField(parentSchemaName, pathToAddressKey.slice(1)),
                variables: {
                    where: { id: parentObjectId },
                    first: 1,
                },
                dataPath: 'objs',
            })

            if (!parentObject) return false

            addressKey = get(parentObject, pathToAddressKey.slice(1))
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

async function canExecuteByServiceUser (params, serviceConfig) {
    const { authentication: { item: user }, args, gqlName } = params
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (!gqlName) return false

    const pathToAddressKey = get(serviceConfig, 'pathToAddressKey')
    if (!pathToAddressKey) return false

    const addressKey = get(args, pathToAddressKey, null)
    if (!addressKey) return false

    const permissionKey = `canExecute${upperFirst(gqlName)}`

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
    // return !isEmpty(B2CAppProperties.filter(b2cAppProperty => b2cAppProperty.isAvailable))
    return !isEmpty(B2CAppProperties)
}

function isServiceUser ({ authentication: { item: user } }) {
    return get(user, 'type') === SERVICE
}

function getRefSchemaName (schemaConfig, listKey) {
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
    return await canManageByServiceUser(args, schemaConfig, refSchemaName) // todo: @toplenboren create a test with offline token for only one organization
}

async function canExecuteServiceAsB2CAppServiceUser (args) {
    const { info: { fieldName: serviceName } } = args
    if (!isServiceUser(args)) return false
    const serviceConfig = get(B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.services, serviceName)
    if (!isObject(serviceConfig)) return false
    return await canExecuteByServiceUser(args, serviceConfig)
}

function canReadObjectsAsB2CAppServiceUserWithoutSpecificRights (args) {
    const { authentication: { item: user }, listKey } = args
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (!isServiceUser(args)) return false
    const config = get(B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS.noRightSetRequired.lists, listKey)
    if (!isObject(config)) return false

    return {
        app: {
            accessRights_some: {
                user: {
                    id: user.id,
                },
                deletedAt: null,
            },
            deletedAt: null,
        },
    }
}

module.exports = {
    canManageObjectsAsB2CAppServiceUser,
    canReadObjectsAsB2CAppServiceUser,
    canExecuteServiceAsB2CAppServiceUser,
    canReadObjectsAsB2CAppServiceUserWithoutSpecificRights,
}
