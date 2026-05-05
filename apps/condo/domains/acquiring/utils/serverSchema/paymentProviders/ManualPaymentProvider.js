const { RENT_PAYMENT_PROVIDER_MANUAL } = require('@condo/domains/acquiring/constants/rentPayment')

const { PaymentProvider } = require('./PaymentProvider')

class ManualPaymentProvider extends PaymentProvider {
    async createPayment (paymentData) {
        return {
            provider: RENT_PAYMENT_PROVIDER_MANUAL,
            paymentMethod: paymentData.paymentMethod,
            externalTransactionId: paymentData.reference || paymentData.externalTransactionId || null,
            paymentData,
        }
    }

    async confirmPayment (paymentData) {
        return {
            provider: RENT_PAYMENT_PROVIDER_MANUAL,
            confirmed: true,
            confirmedAt: paymentData.confirmedAt || new Date().toISOString(),
            paymentMethod: paymentData.paymentMethod,
            externalTransactionId: paymentData.reference || paymentData.externalTransactionId || null,
            paymentData,
        }
    }

    async parseWebhook (payload) {
        return payload
    }
}

module.exports = {
    ManualPaymentProvider,
}