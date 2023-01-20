const { find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')

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