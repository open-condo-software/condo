const {
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
    SUPPORTED_RENT_PAYMENT_PROVIDERS,
} = require('@condo/domains/acquiring/constants/rentPayment')

const { HubtelPaymentProvider } = require('./HubtelPaymentProvider')
const { ManualPaymentProvider } = require('./ManualPaymentProvider')
const { PaystackPaymentProvider } = require('./PaystackPaymentProvider')
const {
    getPaymentProvider,
    getPaymentProviderMetadata,
    listPaymentProviderMetadata,
    PAYMENT_PROVIDER_REGISTRY,
    UnknownPaymentProviderError,
} = require('./index')

describe('payment provider registry', () => {
    test('looks up providers by explicit code', () => {
        expect(getPaymentProvider(RENT_PAYMENT_PROVIDER_MANUAL)).toBeInstanceOf(ManualPaymentProvider)
        expect(getPaymentProvider(RENT_PAYMENT_PROVIDER_PAYSTACK)).toBeInstanceOf(PaystackPaymentProvider)
        expect(getPaymentProvider(RENT_PAYMENT_PROVIDER_HUBTEL)).toBeInstanceOf(HubtelPaymentProvider)
    })

    test('rejects unknown provider codes with a typed error', () => {
        expect(() => getPaymentProvider('unknown-provider')).toThrow(UnknownPaymentProviderError)
        expect(() => getPaymentProvider('unknown-provider')).toThrow('Unknown payment provider "unknown-provider"')

        try {
            getPaymentProvider('unknown-provider')
        } catch (error) {
            expect(error).toMatchObject({
                name: 'UnknownPaymentProviderError',
                code: 'PAYMENT_PROVIDER_UNKNOWN',
                provider: 'unknown-provider',
            })
        }
    })

    test('returns provider capability metadata', () => {
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_MANUAL)).toEqual({
            code: RENT_PAYMENT_PROVIDER_MANUAL,
            configured: true,
            capabilities: {
                canInitializePayment: true,
                canVerifyPayment: true,
                canHandleWebhook: false,
                isManual: true,
            },
        })
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_PAYSTACK)).toMatchObject({
            code: RENT_PAYMENT_PROVIDER_PAYSTACK,
            capabilities: {
                canInitializePayment: true,
                canVerifyPayment: true,
                canHandleWebhook: true,
                isManual: false,
            },
        })
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_HUBTEL)).toMatchObject({
            code: RENT_PAYMENT_PROVIDER_HUBTEL,
            capabilities: {
                canInitializePayment: true,
                canVerifyPayment: true,
                canHandleWebhook: true,
                isManual: false,
            },
        })
    })

    test('distinguishes configured and unconfigured providers', () => {
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_MANUAL).configured).toBe(true)
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_PAYSTACK).configured).toBe(false)
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_PAYSTACK, {
            secretKey: 'sk_test_paystack',
        }).configured).toBe(true)
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_HUBTEL).configured).toBe(false)
        expect(getPaymentProviderMetadata(RENT_PAYMENT_PROVIDER_HUBTEL, {
            secretKey: 'hubtel_test_secret',
        }).configured).toBe(true)
    })

    test('keeps registry parity with the explicitly supported providers', () => {
        const registryCodes = Object.keys(PAYMENT_PROVIDER_REGISTRY).sort()
        const listedCodes = listPaymentProviderMetadata().map(({ code }) => code).sort()
        const supportedCodes = [...SUPPORTED_RENT_PAYMENT_PROVIDERS].sort()

        expect(registryCodes).toEqual(supportedCodes)
        expect(listedCodes).toEqual(supportedCodes)
    })
})
