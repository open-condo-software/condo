const { generateGqlQueries } = require('@condo/codegen/generate.gql')

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const WEBHOOK_FIELDS = `{ name description url user { id } ${COMMON_FIELDS} }`
const WebhookGQL = generateGqlQueries('Webhook', WEBHOOK_FIELDS)

const WEBHOOK_SUBSCRIPTION_FIELDS = `{ webhook { id url user { id } } url syncedAt syncedAmount model fields filters maxPackSize ${COMMON_FIELDS} }`
const WebhookSubscriptionGQL = generateGqlQueries('WebhookSubscription', WEBHOOK_SUBSCRIPTION_FIELDS)

module.exports = {
    WebhookGQL,
    WebhookSubscriptionGQL,
}