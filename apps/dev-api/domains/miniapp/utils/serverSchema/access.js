const get = require('lodash/get')

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

async function canCreateB2CAppLinkedModelAsOwner (args) {
    return await canCreateAppLinkedModelAsOwner(args, 'B2CApp')
}

async function canExecuteB2CAppMutationAsOwner (params) {
    const { authentication: { item: user }, args } = params

    const app = await getByCondition('B2CApp', { id: args.data.app.id, deletedAt: null })
    return Boolean(app && app.createdBy === user.id)
}

module.exports = {
    canCreateB2CAppLinkedModelAsOwner,
    canReadAppLinkedModelAsOwner,
    canExecuteB2CAppMutationAsOwner,
}