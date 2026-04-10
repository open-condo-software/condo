const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { PROD_ENVIRONMENT, PUBLISH_REQUEST_APPROVED_STATUS } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const { publishB2CApp: publishB2CAppMutation, B2CAppPublishRequest } = require('@dev-portal-api/domains/miniapp/utils/serverSchema')


async function publishB2CApp (appId, environment) {
    const { keystone: context } = getSchemaCtx('B2CApp')

    if (environment === PROD_ENVIRONMENT) {
        const request = await B2CAppPublishRequest.getOne(context, {
            app: { id: appId },
            deletedAt: null,
            status: PUBLISH_REQUEST_APPROVED_STATUS,
        })

        if (!request) {
            return
        }
    }

    try {
        await publishB2CAppMutation(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: 'publish-b2c-app-task' },
            app: { id: appId },
            environment,
            options: { info: true },
        })
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    publishB2CApp: createTask('publishB2CApp', publishB2CApp),
}