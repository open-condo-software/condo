const { RENT_PAYMENT_PROVIDER_MANUAL } = require('@condo/domains/acquiring/constants/rentPayment')
const {
    PAYMENT_DONE_STATUS,
    PAYMENT_INIT_STATUS,
} = require('@condo/domains/acquiring/constants/payment')

const { PaymentProvider } = require('./PaymentProvider')

class ManualPaymentProvider extends PaymentProvider {
    get provider () {
        return RENT_PAYMENT_PROVIDER_MANUAL
    }

    getStatusMap () {
        return {
            ...super.getStatusMap(),
            manual_created: PAYMENT_INIT_STATUS,
            manual_confirmed: PAYMENT_DONE_STATUS,
        }
    }

    async initializePayment (paymentData) {
        return {
            provider: this.provider,
            status: this.normaliseProviderStatus('manual_created'),
            providerStatus: 'manual_created',
            paymentMethod: paymentData.paymentMethod,
            externalTransactionId: this.mapProviderReference(paymentData),
            paymentData,
        }
    }

    async verifyPayment (paymentData) {
        const providerStatus = paymentData.providerStatus || 'manual_confirmed'

        return {
            provider: this.provider,
            confirmed: true,
            confirmedAt: paymentData.confirmedAt || new Date().toISOString(),
            status: this.normaliseProviderStatus(providerStatus),
            providerStatus,
            paymentMethod: paymentData.paymentMethod,
            externalTransactionId: this.mapProviderReference(paymentData),
            paymentData,
        }
    }

    async handleWebhook (payload) {
        return this.buildWebhookResponse({
            acknowledged: true,
            processed: false,
            payload,
            metadata: {
                unsupported: true,
            },
        })
    }
}

module.exports = {
    ManualPaymentProvider,
}
