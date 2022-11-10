const { find } = require('@condo/keystone/schema')
const { sendWebhook } = require('@condo/webhooks/tasks/sendWebhook')
const { createTask } = require('@condo/keystone/tasks')

async function sendModelWebhooks (modelName) {
    // TODO(DOMA-4570): Add filter for only responsive subscriptions (failCount < threshold)
    // NOTE: find to bypass default limitations, since relations are not used here
    const subscriptions = await find('WebhookSubscription', {
        deletedAt: null,
        model: modelName,
        webhook: {  deletedAt: null },
    })

    for (const subscription of subscriptions) {
        await sendWebhook.delay(subscription.id)
    }
}

module.exports = {
    sendModelWebhooks: createTask('sendModelWebhooks', sendModelWebhooks, { priority: 3 }),
}