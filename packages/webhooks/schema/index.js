const { Webhook } = require('@open-condo/webhooks/schema/models/Webhook')
const { WebhookPayload } = require('@open-condo/webhooks/schema/models/WebhookPayload')
const { getWebhookSubscriptionModel } = require('@open-condo/webhooks/schema/models/WebhookSubscription')

/**
 * Returns all webhook models (Webhook, WebhookSubscription, WebhookPayload)
 * @param {string} schemaPath - Path to GraphQL schema file
 * @returns {Object} Object with Webhook, WebhookSubscription, and WebhookPayload models
 */
function getWebhookModels (schemaPath) {
    return {
        Webhook,
        WebhookSubscription: getWebhookSubscriptionModel(schemaPath),
        WebhookPayload,
    }
}

module.exports = {
    getWebhookModels,
}
