const { generateServerUtils } = require('@condo/codegen/generate.server.utils')
const { WebhookGQL, WebhookSubscriptionGQL } = require('@condo/webhooks/schema/gql')

const Webhook = generateServerUtils(WebhookGQL)
const WebhookSubscription = generateServerUtils(WebhookSubscriptionGQL)

module.exports = {
    Webhook,
    WebhookSubscription,
}
