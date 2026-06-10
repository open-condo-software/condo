const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { nonNull } = require('@open-condo/miniapp-utils/helpers/collections')
const { getWebhookModels } = require('@open-condo/webhooks/schema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const { FileUploadMiddleware } = require('@dev-portal-api/domains/common/middlewares/FileUploadMiddleware')
const { OIDCMiddleware } = require('@dev-portal-api/domains/common/middlewares/OIDCMiddleware')
const { makeFileAdapterMiddleware } = require('@dev-portal-api/domains/common/utils/files')


const schemas = () => [
    require('@dev-portal-api/domains/user/schema'),
    require('@dev-portal-api/domains/miniapp/schema'),
    getWebhookModels('@app/dev-portal-api/schema.graphql'),
]

const apps = () => {
    const allApps = [
        makeFileAdapterMiddleware(),
        OIDCMiddleware,
        FileUploadMiddleware,
    ].filter(nonNull)

    return allApps
}

const tasks = () => [
    getWebhookTasks(),
]

module.exports = prepareKeystone({
    schemas, apps, tasks,
})
