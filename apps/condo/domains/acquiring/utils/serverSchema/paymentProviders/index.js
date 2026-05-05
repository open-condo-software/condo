const {
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
} = require('@condo/domains/acquiring/constants/rentPayment')

const { HubtelPaymentProvider } = require('./HubtelPaymentProvider')
const { ManualPaymentProvider } = require('./ManualPaymentProvider')
const { PaystackPaymentProvider } = require('./PaystackPaymentProvider')

class UnknownPaymentProviderError extends Error {
    constructor (provider) {
        super(`Unknown payment provider "${provider}"`)
        this.name = 'UnknownPaymentProviderError'
        this.code = 'PAYMENT_PROVIDER_UNKNOWN'
        this.provider = provider
    }
}

const PAYMENT_PROVIDER_REGISTRY = Object.freeze({
    [RENT_PAYMENT_PROVIDER_MANUAL]: Object.freeze({
        code: RENT_PAYMENT_PROVIDER_MANUAL,
        Provider: ManualPaymentProvider,
    }),
    [RENT_PAYMENT_PROVIDER_PAYSTACK]: Object.freeze({
        code: RENT_PAYMENT_PROVIDER_PAYSTACK,
        Provider: PaystackPaymentProvider,
    }),
    [RENT_PAYMENT_PROVIDER_HUBTEL]: Object.freeze({
        code: RENT_PAYMENT_PROVIDER_HUBTEL,
        Provider: HubtelPaymentProvider,
    }),
})

function getPaymentProviderRegistryEntry (provider) {
    const entry = provider ? PAYMENT_PROVIDER_REGISTRY[provider] : null

    if (!entry) {
        throw new UnknownPaymentProviderError(provider)
    }

    return entry
}

function getPaymentProvider (provider, options = {}) {
    const { Provider } = getPaymentProviderRegistryEntry(provider)

    return new Provider(options)
}

function getPaymentProviderMetadata (provider, options = {}) {
    const paymentProvider = getPaymentProvider(provider, options)

    return {
        code: paymentProvider.provider,
        configured: paymentProvider.isConfigured(),
        capabilities: paymentProvider.getCapabilities(),
    }
}

function listPaymentProviderMetadata (optionsByProvider = {}) {
    return Object.keys(PAYMENT_PROVIDER_REGISTRY).map((provider) => {
        return getPaymentProviderMetadata(provider, optionsByProvider[provider] || {})
    })
}

module.exports = {
    getPaymentProviderMetadata,
    getPaymentProviderRegistryEntry,
    getPaymentProvider,
    listPaymentProviderMetadata,
    HubtelPaymentProvider,
    ManualPaymentProvider,
    PAYMENT_PROVIDER_REGISTRY,
    PaystackPaymentProvider,
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
    UnknownPaymentProviderError,
}
