const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')

const Webhook = generateServerUtils('Webhook')
const WebhookSubscription = generateServerUtils('WebhookSubscription')

module.exports = {
    Webhook,
    WebhookSubscription,
}
