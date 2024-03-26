const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { getWebhookModels, getWebhookTasks } = require('@open-condo/webhooks/schema')

const { makeFileAdapterMiddleware } = require('@dev-api/domains/common/utils/files')

const schemas = () => [
    require('@dev-api/domains/user/schema'),
    require('@dev-api/domains/miniapp/schema'),
    getWebhookModels('@app/dev-api/schema.graphql'),
]

const apps = () => [
    makeFileAdapterMiddleware(),
]
const tasks = () => [
    getWebhookTasks(),
]

module.exports = prepareKeystone({
    schemas, apps, tasks, queues: ['medium'],
})
