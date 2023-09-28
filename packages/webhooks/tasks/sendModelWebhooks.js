const { find } = require('@open-condo/keystone/schema')

const { sendWebhookTask } = require('./index')

async function sendModelWebhooks (modelName) {
    // TODO(DOMA-4570): Add filter for only responsive subscriptions (failCount < threshold)
    // NOTE: find to bypass default limitations, since relations are not used here
    const subscriptions = await find('WebhookSubscription', {
        deletedAt: null,
        model: modelName,
        webhook: {  deletedAt: null },
    })

    for (const subscription of subscriptions) {
        await sendWebhookTask.delay(subscription.id)
    }
}

module.exports = {
    sendModelWebhooks,
}