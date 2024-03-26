const { Webhook } = require('@open-condo/webhooks/schema/models/Webhook')
const { getWebhookSubscriptionModel } = require('@open-condo/webhooks/schema/models/WebhookSubscription')

function getWebhookModels (schemaPath) {
    return {
        Webhook,
        WebhookSubscription: getWebhookSubscriptionModel(schemaPath),
    }
}

module.exports = {
    getWebhookModels,
}
