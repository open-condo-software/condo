const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { get } = require('lodash')
const {
    queryOrganizationEmployeeFor,
    queryOrganizationEmployeeFromRelatedOrganizationFor,
} = require('@condo/domains/organization/utils/accessSchema')
const { Organization, OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')

const userIsAuthenticated = ({ authentication: { item: user } }) => Boolean(user && user.id)

const userIsAdmin = ({ authentication: { item: user } }) => Boolean(user && user.isAdmin)

const userIsThisItem = ({ existingItem, authentication: { item: user } }) => {
    if (!user || !existingItem) {
        return false
    }
    return existingItem.id === user.id
}

const userIsOwner = ({ existingItem, authentication: { item: user } }) => {
    if (!user || !existingItem || !existingItem.user) {
        return false
    }
    return existingItem.user.id === user.id
}

const userIsAdminOrOwner = (auth) => {
    const isAdmin = userIsAdmin(auth)
    const isOwner = userIsOwner(auth)
    return Boolean(isAdmin || isOwner)
}

const userIsAdminOrIsThisItem = (auth) => {
    const isAdmin = userIsAdmin(auth)
    const isThisItem = userIsThisItem(auth)
    return Boolean(isAdmin || isThisItem)
}

const canReadOnlyActive = ({ authentication: { item: user } }) => {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return {}

    // Approximately; users.filter(user => user.isActive === true);
    return {
        isActive: true,
    }
}

const userIsNotResidentUser = ({ authentication: { item: user } }) => {
    if (!user) return false
    if (user.type === RESIDENT) return false
    return true
}

const canReadOnlyIfUserIsActiveOrganizationEmployee = async ({ context, existingItem, authentication: { item: user } }) => {
    if (user.isAdmin || user.isSupport) return true

    if (!userIsNotResidentUser({ authentication: { item: user } })) return false

    const userId = get(user, 'id')
    const existingItemId = get(existingItem, 'id', null)

    const availableOrganizations = await Organization.getAll(context, {
        id: existingItemId,
        OR: [queryOrganizationEmployeeFor(userId), queryOrganizationEmployeeFromRelatedOrganizationFor(userId)],
    })

    return availableOrganizations.length > 0
}

const canReadOnlyIfInUsers = ({ authentication: { item: user } }) => {
    if (!user) return throwAuthenticationError()
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
    const isJustSoftDelete =
        Object.keys(originalInput).length === 3 &&
        get(originalInput, 'deletedAt') &&
        get(originalInput, 'dv') &&
        get(originalInput, 'sender')
    const isSoftDeleteWithMerge =
        Object.keys(originalInput).length === 4 &&
        get(originalInput, 'deletedAt') &&
        get(originalInput, 'newId') &&
        get(originalInput, 'dv') &&
        get(originalInput, 'sender')
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
