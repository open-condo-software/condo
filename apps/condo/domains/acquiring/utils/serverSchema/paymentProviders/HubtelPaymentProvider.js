const { RENT_PAYMENT_PROVIDER_HUBTEL } = require('@condo/domains/acquiring/constants/rentPayment')

const { PaymentProvider } = require('./PaymentProvider')

class HubtelPaymentProvider extends PaymentProvider {
    get provider () {
        return RENT_PAYMENT_PROVIDER_HUBTEL
    }

    mapProviderReference (payload = {}) {
        const nestedPayload = payload && payload.data && typeof payload.data === 'object' ? payload.data : null
        const hubtelReference = payload.clientReference ||
            (nestedPayload && (nestedPayload.clientReference || nestedPayload.checkoutId))

        return hubtelReference ? String(hubtelReference) : super.mapProviderReference(payload)
    }

    async initializePayment () {
        this.unsupportedOperation('initializePayment')
    }

    async verifyPayment () {
        this.unsupportedOperation('verifyPayment')
    }

    async handleWebhook (payload) {
        const providerStatus = payload && payload.data && payload.data.status
            ? payload.data.status
            : payload && payload.status
                ? payload.status
                : null

        return this.buildWebhookResponse({
            acknowledged: true,
            processed: false,
            payload,
            providerStatus,
            metadata: {
                stub: true,
            },
        })
    }
}

module.exports = {
    HubtelPaymentProvider,
}
