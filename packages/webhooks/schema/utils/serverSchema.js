const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')

const Webhook = generateServerUtils('Webhook')
const WebhookSubscription = generateServerUtils('WebhookSubscription')
const WebhookPayload = generateServerUtils('WebhookPayload')

module.exports = {
    Webhook,
    WebhookSubscription,
    WebhookPayload,
}
