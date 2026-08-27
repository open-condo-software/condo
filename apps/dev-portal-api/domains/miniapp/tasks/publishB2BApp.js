const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { PROD_ENVIRONMENT, PUBLISH_REQUEST_APPROVED_STATUS } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const { publishB2BApp: publishB2BAppUtil, B2BAppPublishRequest } = require('@dev-portal-api/domains/miniapp/utils/serverSchema')

const logger = getLogger()

async function publishB2BApp (appId, environment) {
    const { keystone: context } = getSchemaCtx('B2BApp')

    if (environment === PROD_ENVIRONMENT) {
        const publishRequest = await B2BAppPublishRequest.getOne(context, {
            app: { id: appId },
            status: PUBLISH_REQUEST_APPROVED_STATUS,
            deletedAt: null,
        })
        if (!publishRequest) {
            return
        }
    }

    try {
        await publishB2BAppUtil(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: 'publish-b2b-app-task' },
            app: { id: appId },
            environment,
            options: { info: true },
        })
        logger.info({
            msg: 'Application was successfully synced with condo',
            entityId: appId,
            entity: 'B2BApp',
            data: { environment },
        })
    } catch (err) {
        logger.error({
            msg: 'Error occurred during application auto-publishing task',
            entityId: appId,
            entity: 'B2BApp',
            err,
            data: { environment },
        })
    }
}

module.exports = {
    publishB2BApp: createTask('publishB2BApp', publishB2BApp),
}