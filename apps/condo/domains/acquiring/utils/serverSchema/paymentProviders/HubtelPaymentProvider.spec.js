const https = require('https')

const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const { RENT_PAYMENT_PROVIDER_HUBTEL } = require('@condo/domains/acquiring/constants/rentPayment')

const { HubtelPaymentProvider } = require('./HubtelPaymentProvider')
const {
    PaymentProviderConfigurationError,
    PaymentProviderValidationError,
} = require('./PaystackPaymentProvider')

const VALID_PAYMENT_DATA = {
    amount: '100.00',
    currency: 'GHS',
    payer: {
        phone: '+233200000000',
    },
    organization: {
        id: 'organization-1',
    },
    payment: {
        id: 'payment-1',
    },
    clientReference: 'hubtel-ref-001',
}

describe('HubtelPaymentProvider.initializePayment', () => {
    test('returns a stable pending initialization response without network requests', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })
        const fetchSpy = jest.spyOn(global, 'fetch')
        const httpsRequestSpy = jest.spyOn(https, 'request')

        const result = await provider.initializePayment(VALID_PAYMENT_DATA)

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            status: PAYMENT_INIT_STATUS,
            providerStatus: 'initialized',
            paymentUrl: null,
            externalTransactionId: 'hubtel-ref-001',
            paymentData: VALID_PAYMENT_DATA,
            metadata: {
                stub: true,
            },
        })
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(httpsRequestSpy).not.toHaveBeenCalled()
    })

    test('maps provider references from nested payload data', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })
        const result = await provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            clientReference: undefined,
            data: {
                checkoutId: 'nested-hubtel-ref-001',
            },
        })

        expect(result.externalTransactionId).toBe('nested-hubtel-ref-001')
    })

    test('requires amount', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        await expect(provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            amount: null,
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            field: 'amount',
        })
    })

    test('requires currency', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        await expect(provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            currency: '',
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            field: 'currency',
        })
    })

    test('requires payer email or phone', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        await expect(provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            payer: {},
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            field: 'payer',
        })
    })

    test('accepts payer email when phone is not provided', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })
        const result = await provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            payer: {
                email: 'resident@example.com',
            },
        })

        expect(result.status).toBe(PAYMENT_INIT_STATUS)
    })

    test('requires organization or payment context', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        await expect(provider.initializePayment({
            amount: '100.00',
            currency: 'GHS',
            payer: {
                phone: '+233200000000',
            },
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            field: 'context',
        })
    })

    test('fails safely when credentials are missing', async () => {
        const provider = new HubtelPaymentProvider()

        await expect(provider.initializePayment(VALID_PAYMENT_DATA)).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
        })
        await expect(provider.initializePayment(VALID_PAYMENT_DATA)).rejects.toThrow('hubtel provider is not configured')
    })

    test('reuses typed configuration and validation errors', () => {
        expect(PaymentProviderConfigurationError).toBeDefined()
        expect(PaymentProviderValidationError).toBeDefined()
    })
})

describe('HubtelPaymentProvider.verifyPayment', () => {
    test('returns a confirmed stub verification result for success without network requests', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })
        const fetchSpy = jest.spyOn(global, 'fetch')
        const httpsRequestSpy = jest.spyOn(https, 'request')

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            paymentMethod: 'momo',
            providerStatus: 'Successful',
            confirmedAt: '2026-05-05T00:00:00.000Z',
        })

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            confirmed: true,
            confirmedAt: '2026-05-05T00:00:00.000Z',
            status: PAYMENT_DONE_STATUS,
            internalStatus: 'confirmed',
            providerStatus: 'Successful',
            paymentMethod: 'momo',
            externalTransactionId: 'hubtel-ref-001',
            paymentData: {
                ...VALID_PAYMENT_DATA,
                paymentMethod: 'momo',
                providerStatus: 'Successful',
                confirmedAt: '2026-05-05T00:00:00.000Z',
            },
            metadata: {
                stub: true,
            },
        })
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(httpsRequestSpy).not.toHaveBeenCalled()
    })

    test('maps failed verification into a stable failed contract', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'Rejected',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_ERROR_STATUS,
            internalStatus: 'failed',
            providerStatus: 'Rejected',
            externalTransactionId: 'hubtel-ref-001',
        })
    })

    test('maps processing-style verification states into pending', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'Pending',
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'Pending',
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'Open',
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'Open',
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'Expired',
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'Expired',
        })
    })

    test('treats unknown verification status as pending with explicit rationale', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'mystery_state',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'mystery_state',
            metadata: {
                stub: true,
                rationale: 'Unknown Hubtel status "mystery_state" is treated as pending in stub mode',
            },
        })
    })

    test('fails safely when verification credentials are missing', async () => {
        const provider = new HubtelPaymentProvider()

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'Successful',
        })).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
        })
    })
})

describe('HubtelPaymentProvider.handleWebhook', () => {
    test('returns an explicit unimplemented verification result', async () => {
        const provider = new HubtelPaymentProvider({ secretKey: 'hubtel_test_secret' })

        await expect(provider.verifyWebhookSignature({}, {})).resolves.toEqual({
            signatureVerified: false,
            signatureVerificationRequired: false,
            signatureVerificationReason: 'Hubtel webhook signature verification is not implemented yet',
        })
    })

    test('returns a stable webhook response shape for success events', async () => {
        const provider = new HubtelPaymentProvider()
        const payload = {
            status: 'Successful',
            data: {
                clientReference: 'hubtel-ref-001',
            },
        }

        const result = await provider.handleWebhook(payload)

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            acknowledged: true,
            processed: false,
            providerStatus: 'Successful',
            status: PAYMENT_DONE_STATUS,
            internalStatus: 'confirmed',
            externalTransactionId: 'hubtel-ref-001',
            payload,
            metadata: {
                internalStatus: 'confirmed',
                signatureVerified: false,
                signatureVerificationRequired: false,
                signatureVerificationReason: 'Hubtel webhook signature verification is not implemented yet',
                stub: true,
            },
            error: null,
        })
    })

    test('returns pending webhook responses for unknown statuses with rationale', async () => {
        const provider = new HubtelPaymentProvider()
        const payload = {
            status: 'mystery_state',
            data: {
                checkoutId: 'hubtel-ref-002',
            },
        }

        const result = await provider.handleWebhook(payload)

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            acknowledged: true,
            processed: false,
            providerStatus: 'mystery_state',
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            externalTransactionId: 'hubtel-ref-002',
            payload,
            metadata: {
                internalStatus: 'pending',
                rationale: 'Unknown Hubtel status "mystery_state" is treated as pending in stub mode',
                signatureVerified: false,
                signatureVerificationRequired: false,
                signatureVerificationReason: 'Hubtel webhook signature verification is not implemented yet',
                stub: true,
            },
            error: null,
        })
    })
})
