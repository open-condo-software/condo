const { find } = require('@open-condo/keystone/schema')

async function sendModelWebhooks (modelName) {
    const { getWebhookTasks } = require('@open-condo/webhooks/schema')
    // TODO(DOMA-4570): Add filter for only responsive subscriptions (failCount < threshold)
    // NOTE: find to bypass default limitations, since relations are not used here
    const subscriptions = await find('WebhookSubscription', {
        deletedAt: null,
        model: modelName,
        webhook: {  deletedAt: null },
    })

    const { sendWebhook } = getWebhookTasks()

    for (const subscription of subscriptions) {
        await sendWebhook.delay(subscription.id)
    }
}

module.exports = {
    sendModelWebhooks,
}
