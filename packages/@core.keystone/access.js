const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { has } = require('lodash')

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
    return (
        originalInput.deletedAt !== null &&
        Object.keys(originalInput).length === 3 &&
        has(originalInput, 'dv') &&
        has(originalInput, 'sender')
    )
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
}
