const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { get } = require('lodash')

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
    const isJustSoftDelete = (
        Object.keys(originalInput).length === 3 &&
        get(originalInput, 'deletedAt') &&
        get(originalInput, 'dv') &&
        get(originalInput, 'sender')
    )
    const isSoftDeleteWithMerge = (
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
}
