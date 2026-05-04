const { RENT_PAYMENT_PROVIDER_HUBTEL } = require('@condo/domains/acquiring/constants/rentPayment')

const { PaymentProvider } = require('./PaymentProvider')

class HubtelPaymentProvider extends PaymentProvider {
    async createPayment () {
        throw new Error(`${RENT_PAYMENT_PROVIDER_HUBTEL} payment creation is not implemented`)
    }

    async confirmPayment () {
        throw new Error(`${RENT_PAYMENT_PROVIDER_HUBTEL} payment confirmation is not implemented`)
    }

    async parseWebhook (payload) {
        return payload
    }
}

module.exports = {
    HubtelPaymentProvider,
}