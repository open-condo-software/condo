const { Webhook } = require('@open-condo/webhooks/schema/models/Webhook')
const { getWebhookPayloadModel } = require('@open-condo/webhooks/schema/models/WebhookPayload')
const { getWebhookSubscriptionModel } = require('@open-condo/webhooks/schema/models/WebhookSubscription')

/**
 * Returns all webhook models (Webhook, WebhookSubscription, WebhookPayload)
 * @param {string} schemaPath - Path to GraphQL schema file
 * @param {Array<string>} [appWebhooksEventsTypes] - Array of event types supported by the application
 * @returns {Object} Object with Webhook, WebhookSubscription, and WebhookPayload models
 */
function getWebhookModels (schemaPath, appWebhooksEventsTypes = []) {
    return {
        Webhook,
        WebhookSubscription: getWebhookSubscriptionModel(schemaPath),
        WebhookPayload: getWebhookPayloadModel(appWebhooksEventsTypes),
    }
}

module.exports = {
    getWebhookModels,
}
