const get = require('lodash/get')
const pluralize =  require('pluralize')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')

const RESIDENT_TYPE_USER = 'resident'

const userIsAuthenticated = (accessArgs) => {
    const { authentication: { item: user } } = accessArgs
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return Boolean(user.id)
}

const userIsAdmin = (accessArgs) => {
    const { authentication: { item: user } } = accessArgs

    return Boolean(userIsAuthenticated(accessArgs) && user.isAdmin)
}

const userIsSupport = (accessArgs) => {
    const { authentication: { item: user } } = accessArgs

    return Boolean(userIsAuthenticated(accessArgs) && user.isSupport)
}

const userIsThisItem = (accessArgs) => {
    const { existingItem, authentication: { item: user } } = accessArgs

    if (!userIsAuthenticated(accessArgs) || !existingItem || !existingItem.id) {
        return false
    }

    return existingItem.id === user.id
}

const userIsOwner = (accessArgs) => {
    const { existingItem, authentication: { item: user } } = accessArgs

    if (!userIsAuthenticated(accessArgs) || !existingItem || !existingItem.user) {
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

const userIsNotResidentUser = (accessArgs) => {
    const { authentication: { item: user } } = accessArgs
    if (!userIsAuthenticated(accessArgs)) return false

    return user.type !== RESIDENT_TYPE_USER
}

const canReadOnlyIfInUsers = (accessArgs) => {
    const { authentication: { item: user } } = accessArgs
    if (!userIsAuthenticated(accessArgs)) return throwAuthenticationError()
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

const readOnlyFieldAccess = {
    read: true,
    create: false,
    update: false,
    delete: false,
}

const writeOnlyServerSideFieldAccess = {
    read: true,
    create: canOnlyServerSideWithoutUserRequest,
    update: canOnlyServerSideWithoutUserRequest,
    delete: false,
}

function isFilteringBy (where, fields) {
    const toProcess = [where]

    while (toProcess.length) {
        const processing = toProcess.pop()
        for (const [filterName, filterValue] of Object.entries(processing)) {
            if (Array.isArray(filterValue) && (filterName === 'AND' || filterName === 'OR')) {
                toProcess.push(...filterValue)
            } else {
                const fieldName = filterName.split('_')[0]
                if (fields.includes(fieldName)) {
                    return true
                }
            }
        }
    }

    return false
}

function isSpecificQuery (queryName) {
    const gqlContext = graphqlCtx.getStore()
    const gqlOperationName = get(gqlContext, 'gqlOperationName')

    return gqlOperationName === queryName
}

function isDirectListQuery (accessArgs) {
    const { listKey } = accessArgs
    const plural = pluralize.plural(listKey)

    return isSpecificQuery(`all${plural}`) || isSpecificQuery(listKey)
}

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
    canOnlyServerSideWithoutUserRequest,
    isFilteringBy,
    isSpecificQuery,
    isDirectListQuery,
    readOnlyFieldAccess,
    writeOnlyServerSideFieldAccess,
}
