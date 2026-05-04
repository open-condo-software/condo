const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')

const { PaymentProvider } = require('./PaymentProvider')

class PaystackPaymentProvider extends PaymentProvider {
    async createPayment () {
        throw new Error(`${RENT_PAYMENT_PROVIDER_PAYSTACK} payment creation is not implemented`)
    }

    async confirmPayment () {
        throw new Error(`${RENT_PAYMENT_PROVIDER_PAYSTACK} payment confirmation is not implemented`)
    }

    async parseWebhook (payload) {
        return payload
    }
}

module.exports = {
    PaystackPaymentProvider,
}