const { Webhook } = require('@condo/webhooks/schema/models/Webhook')
const { getWebhookSubscriptionModel } = require('@condo/webhooks/schema/models/WebhookSubscription')

function getWebhookModels (modelValidator) {
    return {
        Webhook,
        WebhookSubscription: getWebhookSubscriptionModel(modelValidator),
    }
}

module.exports = {
    getWebhookModels,
}