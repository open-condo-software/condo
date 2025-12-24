const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const WEBHOOK_FIELDS = `{ name description url user { id } ${COMMON_FIELDS} }`
const WebhookGQL = generateGqlQueries('Webhook', WEBHOOK_FIELDS)

const WEBHOOK_SUBSCRIPTION_FIELDS = `{ webhook { id url user { id } } url syncedAt syncedAmount failuresCount model fields filters maxPackSize ${COMMON_FIELDS} }`
const WebhookSubscriptionGQL = generateGqlQueries('WebhookSubscription', WEBHOOK_SUBSCRIPTION_FIELDS)

const WEBHOOK_PAYLOAD_FIELDS = `{ payload url secret eventType modelName itemId webhookSubscription { id url model } status attempt lastHttpStatusCode lastResponseBody lastErrorMessage expiresAt nextRetryAt lastSentAt ${COMMON_FIELDS} }`
const WebhookPayloadGQL = generateGqlQueries('WebhookPayload', WEBHOOK_PAYLOAD_FIELDS)

module.exports = {
    WebhookGQL,
    WebhookSubscriptionGQL,
    WebhookPayloadGQL,
}