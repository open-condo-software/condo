const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { B2BApp, B2CApp } = require('@condo/domains/miniapp/utils/serverSchema')

const SENDER = { dv: 1, fingerprint: 'update-related-miniapps-task' }

async function updateRelatedMiniappsFromOIDCClient (clientId) {
    const { keystone: context } = getSchemaCtx('B2BApp')

    const b2bApps = await find('B2BApp', {
        oidcClient: { id: clientId },
        deletedAt: null,
    })
    const b2cApps = await find('B2CApp', {
        oidcClient: { id: clientId },
        deletedAt: null,
    })

    await B2BApp.updateMany(context, b2bApps.map(app => ({
        id: app.id,
        data: {
            dv: 1,
            sender: SENDER,
        },
    })))

    await B2CApp.updateMany(context, b2cApps.map(app => ({
        id: app.id,
        data: {
            dv: 1,
            sender: SENDER,
        },
    })))
}

module.exports = {
    updateRelatedMiniappsFromOIDCClient: createTask('updateRelatedMiniappsFromOIDCClient', updateRelatedMiniappsFromOIDCClient),
}