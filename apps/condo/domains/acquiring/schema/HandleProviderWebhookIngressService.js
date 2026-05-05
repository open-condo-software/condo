const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/acquiring/access/PublicRentPaymentService')
const { handleProviderWebhookRequestPublic } = require('@condo/domains/acquiring/utils/serverSchema')

const HandleProviderWebhookIngressService = new GQLCustomSchema('HandleProviderWebhookIngressService', {
    types: [
        {
            access: true,
            type: 'input HandleProviderWebhookIngressInput { providerCode: String, provider: String, payload: JSON, parsedPayload: JSON, webhookPayload: JSON, metadata: JSON, headers: JSON, rawBody: String, environment: String, mode: String, testMode: Boolean, sandbox: Boolean, requireVerifiedSignature: Boolean, confirmedAt: String }',
        },
        {
            access: true,
            type: 'type HandleProviderWebhookIngressOutput { paymentId: ID, provider: String, providerReference: String, amount: String, currency: String, status: String, authorizationUrl: String, paymentUrl: String, actionTaken: String }',
        },
    ],

    mutations: [
        {
            access: access.canHandleProviderWebhookIngress,
            schema: 'handleProviderWebhookIngress(data: HandleProviderWebhookIngressInput!): HandleProviderWebhookIngressOutput',
            resolver: async (parent, args, context) => {
                return await handleProviderWebhookRequestPublic(context, args.data)
            },
        },
    ],
})

module.exports = {
    HandleProviderWebhookIngressService,
}
