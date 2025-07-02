const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { getWebhookModels } = require('@open-condo/webhooks/schema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const { makeFileAdapterMiddleware } = require('@dev-portal-api/domains/common/utils/files')

const schemas = () => [
    require('@dev-portal-api/domains/user/schema'),
    require('@dev-portal-api/domains/miniapp/schema'),
    getWebhookModels('@app/dev-portal-api/schema.graphql'),
]

const apps = () => [
    makeFileAdapterMiddleware(),
]
const tasks = () => [
    getWebhookTasks(),
]

module.exports = prepareKeystone({
    schemas, apps, tasks,
})
