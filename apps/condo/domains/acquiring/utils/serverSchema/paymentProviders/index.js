const {
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
} = require('@condo/domains/acquiring/constants/rentPayment')

const { HubtelPaymentProvider } = require('./HubtelPaymentProvider')
const { ManualPaymentProvider } = require('./ManualPaymentProvider')
const { PaystackPaymentProvider } = require('./PaystackPaymentProvider')

function getPaymentProvider (provider, options = {}) {
    if (provider === RENT_PAYMENT_PROVIDER_PAYSTACK) return new PaystackPaymentProvider(options)
    if (provider === RENT_PAYMENT_PROVIDER_HUBTEL) return new HubtelPaymentProvider(options)

    return new ManualPaymentProvider(options)
}

module.exports = {
    getPaymentProvider,
    HubtelPaymentProvider,
    ManualPaymentProvider,
    PaystackPaymentProvider,
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
}