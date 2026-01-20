const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find, getByCondition } = require('@open-condo/keystone/schema')

function canReadAppLinkedModelAsOwner ({ authentication: { item: user } }, appField = 'app') {
    return { [appField]: { createdBy: { id: user.id } } }
}

async function canCreateAppLinkedModelAsOwner ({ authentication: { item: user }, originalInput }, modelName) {
    const appIds = Array.isArray(originalInput)
        ? originalInput.map(input => get(input, ['data', 'app', 'connect', 'id']))
        : [get(originalInput, ['app', 'connect', 'id'])]
    if (appIds.some(id => !id)) {
        return false
    }
    const apps = await find(modelName, { id_in: appIds, deletedAt: null })
    if (apps.length !== (new Set(appIds)).size) {
        return false
    }

    return apps.every(app => app.createdBy === user.id)
}

async function canCreateB2BAppLinkedModelAsOwner (args) {
    return await canCreateAppLinkedModelAsOwner(args, 'B2BApp')
}

async function canCreateB2CAppLinkedModelAsOwner (args) {
    return await canCreateAppLinkedModelAsOwner(args, 'B2CApp')
}

async function canExecuteB2CAppMutationAsOwner (params) {
    const { authentication: { item: user }, args } = params

    const app = await getByCondition('B2CApp', { id: args.data.app.id, deletedAt: null })
    return Boolean(app && app.createdBy === user.id)
}

async function canExecuteB2BAppMutationAsOwner (params) {
    const { authentication: { item: user }, args } = params

    const app = await getByCondition('B2BApp', { id: args.data.app.id, deletedAt: null })
    return Boolean(app && app.createdBy === user.id)
}

async function canExecuteAppMutationAsOwner (args) {
    return await Promise.all([
        canExecuteB2CAppMutationAsOwner(args),
        canExecuteB2BAppMutationAsOwner(args),
    ]).then(results => results.some(Boolean))
}

async function canReadAppSchemas ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) return {}

    return { createdBy: { id: user.id } }
}

async function canManageAppSchemas ({ authentication: { item: user }, operation, itemId, itemIds, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    if (operation === 'create') {
        return true
    } else if (operation === 'update') {
        const ids = itemIds || [itemId]
        const apps = await find(listKey, {
            id_in: ids,
            deletedAt: null,
        })
        if (apps.length !== (new Set(ids)).size) {
            return false
        }

        return apps.every(app => app.createdBy === user.id)
    }

    return false
}

module.exports = {
    canReadAppSchemas,
    canManageAppSchemas,
    canCreateB2BAppLinkedModelAsOwner,
    canCreateB2CAppLinkedModelAsOwner,
    canReadAppLinkedModelAsOwner,
    canExecuteB2CAppMutationAsOwner,
    canExecuteB2BAppMutationAsOwner,
    canExecuteAppMutationAsOwner,
}