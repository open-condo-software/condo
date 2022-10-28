const { Webhook } = require('@condo/webhooks/schema/models/Webhook')
const { getWebhookSubscriptionModel } = require('@condo/webhooks/schema/models/WebhookSubscription')

function getWebhookModels (schemaPath) {
    return {
        Webhook,
        WebhookSubscription: getWebhookSubscriptionModel(schemaPath),
    }
}

module.exports = {
    getWebhookModels,
}