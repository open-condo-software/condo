const { get } = require('lodash')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
// TODO (DOMA-3868) Remove domain specific logic from here
const { find } = require('@open-condo/keystone/schema')

const RESIDENT_TYPE_USER = 'resident'
const queryOrganizationEmployeeFor = userId => ({ employees_some: { user: { id: userId }, isBlocked: false, deletedAt: null } })
const queryOrganizationEmployeeFromRelatedOrganizationFor = userId => ({ relatedOrganizations_some: { from: queryOrganizationEmployeeFor(userId) } })

const userIsAuthenticated = (args) => {
    const { authentication: { item: user } } = args
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return Boolean(user.id)
}

const userIsAdmin = (args) => {
    const { authentication: { item: user } } = args

    return Boolean(userIsAuthenticated(args) && user.isAdmin)
}

const userIsSupport = (args) => {
    const { authentication: { item: user } } = args

    return Boolean(userIsAuthenticated(args) && user.isSupport)
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

const userIsAdminOrIsSupport = auth => {
    const isAdmin = userIsAdmin(auth)
    const isSupport = userIsSupport(auth)

    return Boolean(isAdmin || isSupport)
}

const userIsAdminOrIsThisItem = auth => {
    const isAdmin = userIsAdmin(auth)
    const isThisItem = userIsThisItem(auth)

    return Boolean(isAdmin || isThisItem)
}

const userIsNotResidentUser = (args) => {
    const { authentication: { item: user } } = args
    if (!userIsAuthenticated(args)) return false

    return user.type !== RESIDENT_TYPE_USER
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

// Operation is forbidden for user of any kind
// Operation is allowed for server utils without user request, for example, workers, that creating Keystone context via `getSchemaCtx` that skips access checks
// Should be used for fields only
const canOnlyServerSideWithoutUserRequest = () => false

// TODO(pahaz): think about naming! ListAccessCheck and FieldAccessCheck has different arguments
module.exports = {
    userIsAuthenticated,
    userIsAdmin,
    userIsSupport,
    userIsAdminOrIsSupport,
    userIsOwner,
    userIsAdminOrOwner,
    userIsThisItem,
    userIsAdminOrIsThisItem,
    canReadOnlyIfInUsers,
    isSoftDelete,
    userIsNotResidentUser,
    canReadOnlyIfUserIsActiveOrganizationEmployee,
    canOnlyServerSideWithoutUserRequest,
}
