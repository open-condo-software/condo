const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { get } = require('lodash')
const { queryOrganizationEmployeeFor, queryOrganizationEmployeeFromRelatedOrganizationFor } = require('@condo/domains/organization/utils/accessSchema')
const { find } = require('@core/keystone/schema')
const { USER_SCHEMA_NAME } = require('@condo/domains/common/constants/utils')

const userIsAuthenticated = (args) => {
    const { authentication: { item, listKey } } = args
    if (!item || !listKey) return throwAuthenticationError()
    if (item.deletedAt) return false
    return Boolean(listKey === USER_SCHEMA_NAME && item.id)
}

const userIsAdmin = (args) => {
    const { authentication: { item: user } } = args
    return Boolean(userIsAuthenticated(args) && user.isAdmin)
}

const userIsThisItem = (args) => {
    const { existingItem, authentication: { item: user } } = args
    if (!userIsAuthenticated(args) || !existingItem || !existingItem.id) {
        return false
    }
    return existingItem.id === user.id
}

const userIsOwner = (args) => {
    const { existingItem, authentication: { item: user } } = args
    if (!userIsAuthenticated(args) || !existingItem || !existingItem.user) {
        return false
    }
    return existingItem.user.id === user.id
}

const userIsAdminOrOwner = auth => {
    const isAdmin = userIsAdmin(auth)
    const isOwner = userIsOwner(auth)
    return Boolean(isAdmin || isOwner)
}

const userIsAdminOrIsThisItem = auth => {
    const isAdmin = userIsAdmin(auth)
    const isThisItem = userIsThisItem(auth)
    return Boolean(isAdmin || isThisItem)
}

const canReadOnlyActive = (args) => {
    const { authentication: { item: user } } = args
    if (!userIsAuthenticated(args)) return false
    if (user.isAdmin) return {}

    // Approximately; users.filter(user => user.isActive === true);
    return {
        isActive: true,
    }
}

const userIsNotResidentUser = (args) => {
    const { authentication: { item: user } } = args
    if (!userIsAuthenticated(args)) return false
    return user.type !== RESIDENT
}

const canReadOnlyIfUserIsActiveOrganizationEmployee = async (args) => {
    const { existingItem, authentication: { item: user } } = args
    if (!userIsAuthenticated(args)) return false

    if (user.isAdmin || user.isSupport)
        return true
    
    if (!userIsNotResidentUser(args))
        return false

    const userId = get(user, 'id')
    const existingItemId = get(existingItem, 'id', null)

    const availableOrganizations = await find('Organization', {
        id: existingItemId,
        OR: [
            queryOrganizationEmployeeFor(userId),
            queryOrganizationEmployeeFromRelatedOrganizationFor(userId),
        ],
        deletedAt: null,
    })

    return availableOrganizations.length > 0
}

const canReadOnlyIfInUsers = (args) => {
    const { authentication: { item: user } } = args
    if (!userIsAuthenticated(args)) return throwAuthenticationError()
    if (user.isAdmin) return {}
    return {
        users_some: { id: user.id },
    }
}

const readOnlyField = {
    read: true,
    create: false,
    update: false,
}

const isSoftDelete = (originalInput) => {
    // TODO(antonal): extract validations of `originalInput` to separate module and user ajv to validate JSON-schema
    const isJustSoftDelete = Boolean(
        Object.keys(originalInput).length === 3 &&
        get(originalInput, 'deletedAt') &&
        get(originalInput, 'dv') &&
        get(originalInput, 'sender')
    )
    const isSoftDeleteWithMerge = Boolean(
        Object.keys(originalInput).length === 4 &&
        get(originalInput, 'deletedAt') &&
        get(originalInput, 'newId') &&
        get(originalInput, 'dv') &&
        get(originalInput, 'sender')
    )
    return isJustSoftDelete || isSoftDeleteWithMerge
}

// TODO(pahaz): think about naming! ListAccessCheck and FieldAccessCheck has different arguments
module.exports = {
    userIsAuthenticated,
    userIsAdmin,
    userIsOwner,
    userIsAdminOrOwner,
    userIsThisItem,
    userIsAdminOrIsThisItem,
    canReadOnlyActive,
    canReadOnlyIfInUsers,
    readOnlyField,
    isSoftDelete,
    userIsNotResidentUser,
    canReadOnlyIfUserIsActiveOrganizationEmployee,
}
