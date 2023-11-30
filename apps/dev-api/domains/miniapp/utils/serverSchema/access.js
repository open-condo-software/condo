const get = require('lodash/get')

const { find } = require('@open-condo/keystone/schema')

function canReadAppLinkedModelAsOwner ({ authentication: { item: user } }) {
    return { app: { createdBy: { id: user.id } } }
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

module.exports = {
    canCreateB2CAppLinkedModelAsOwner,
    canReadAppLinkedModelAsOwner,
}