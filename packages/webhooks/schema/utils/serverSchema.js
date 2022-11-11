const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { WebhookGQL, WebhookSubscriptionGQL } = require('@open-condo/webhooks/schema/gql')

const Webhook = generateServerUtils(WebhookGQL)
const WebhookSubscription = generateServerUtils(WebhookSubscriptionGQL)

module.exports = {
    Webhook,
    WebhookSubscription,
}
