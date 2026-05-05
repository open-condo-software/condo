const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')
const { PAYMENT_DONE_STATUS } = require('@condo/domains/acquiring/constants/payment')

const { PaymentProvider } = require('./PaymentProvider')

class PaystackPaymentProvider extends PaymentProvider {
    get provider () {
        return RENT_PAYMENT_PROVIDER_PAYSTACK
    }

    getStatusMap () {
        return {
            ...super.getStatusMap(),
            charge_success: PAYMENT_DONE_STATUS,
        }
    }

    mapProviderReference (payload = {}) {
        const nestedPayload = payload && payload.data && typeof payload.data === 'object' ? payload.data : null
        const paystackReference = payload.reference ||
            (nestedPayload && (nestedPayload.reference || nestedPayload.gateway_response))

        return paystackReference ? String(paystackReference) : super.mapProviderReference(payload)
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
            : payload && payload.event === 'charge.success'
                ? 'charge_success'
                : null

        return this.buildWebhookResponse({
            acknowledged: true,
            processed: false,
            payload,
            providerStatus,
            metadata: {
                event: payload && payload.event ? payload.event : null,
                stub: true,
            },
        })
    }
}

module.exports = {
    PaystackPaymentProvider,
}
