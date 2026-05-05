const https = require('https')

const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')

const {
    PaymentProviderConfigurationError,
    PaymentProviderValidationError,
    PaystackPaymentProvider,
} = require('./PaystackPaymentProvider')

const VALID_PAYMENT_DATA = {
    amount: '100.00',
    currency: 'NGN',
    payer: {
        email: 'resident@example.com',
    },
    organization: {
        id: 'organization-1',
    },
    payment: {
        id: 'payment-1',
    },
    reference: 'paystack-ref-001',
}

describe('PaystackPaymentProvider.initializePayment', () => {
    test('returns a stable pending initialization response without network requests', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })
        const fetchSpy = jest.spyOn(global, 'fetch')
        const httpsRequestSpy = jest.spyOn(https, 'request')

        const result = await provider.initializePayment(VALID_PAYMENT_DATA)

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            status: PAYMENT_INIT_STATUS,
            providerStatus: 'initialized',
            paymentUrl: null,
            externalTransactionId: 'paystack-ref-001',
            paymentData: VALID_PAYMENT_DATA,
            metadata: {
                stub: true,
            },
        })
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(httpsRequestSpy).not.toHaveBeenCalled()
    })

    test('maps provider references from nested payload data', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })
        const result = await provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            reference: undefined,
            data: {
                reference: 'nested-paystack-ref-001',
            },
        })

        expect(result.externalTransactionId).toBe('nested-paystack-ref-001')
    })

    test('requires amount', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        await expect(provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            amount: null,
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            field: 'amount',
        })
    })

    test('requires currency', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        await expect(provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            currency: '',
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            field: 'currency',
        })
    })

    test('requires payer email or phone', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        await expect(provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            payer: {},
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            field: 'payer',
        })
    })

    test('accepts payer phone when email is not provided', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })
        const result = await provider.initializePayment({
            ...VALID_PAYMENT_DATA,
            payer: {
                phone: '+2348000000000',
            },
        })

        expect(result.status).toBe(PAYMENT_INIT_STATUS)
    })

    test('requires organization or payment context', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        await expect(provider.initializePayment({
            amount: '100.00',
            currency: 'NGN',
            payer: {
                email: 'resident@example.com',
            },
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            field: 'context',
        })
    })

    test('fails safely when credentials are missing', async () => {
        const provider = new PaystackPaymentProvider()

        await expect(provider.initializePayment(VALID_PAYMENT_DATA)).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })
        await expect(provider.initializePayment(VALID_PAYMENT_DATA)).rejects.toThrow('paystack provider is not configured')
    })

    test('exports typed configuration and validation errors', () => {
        expect(PaymentProviderConfigurationError).toBeDefined()
        expect(PaymentProviderValidationError).toBeDefined()
    })
})

describe('PaystackPaymentProvider.verifyPayment', () => {
    test('returns a confirmed stub verification result for success without network requests', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })
        const fetchSpy = jest.spyOn(global, 'fetch')
        const httpsRequestSpy = jest.spyOn(https, 'request')

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            paymentMethod: 'card',
            providerStatus: 'success',
            confirmedAt: '2026-05-05T00:00:00.000Z',
        })

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            confirmed: true,
            confirmedAt: '2026-05-05T00:00:00.000Z',
            status: PAYMENT_DONE_STATUS,
            internalStatus: 'confirmed',
            providerStatus: 'success',
            paymentMethod: 'card',
            externalTransactionId: 'paystack-ref-001',
            paymentData: {
                ...VALID_PAYMENT_DATA,
                paymentMethod: 'card',
                providerStatus: 'success',
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
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'failed',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_ERROR_STATUS,
            internalStatus: 'failed',
            providerStatus: 'failed',
            externalTransactionId: 'paystack-ref-001',
        })
    })

    test('maps abandoned pending and ongoing verification states into pending', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'abandoned',
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'abandoned',
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'pending',
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'pending',
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'ongoing',
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'ongoing',
        })
    })

    test('treats unknown verification status as pending with explicit rationale', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'mystery_state',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'mystery_state',
            metadata: {
                stub: true,
                rationale: 'Unknown Paystack status "mystery_state" is treated as pending in stub mode',
            },
        })
    })

    test('fails safely when verification credentials are missing', async () => {
        const provider = new PaystackPaymentProvider()

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            providerStatus: 'success',
        })).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })
    })
})

describe('PaystackPaymentProvider.handleWebhook', () => {
    test('returns a stable webhook response shape for success events', async () => {
        const provider = new PaystackPaymentProvider()
        const payload = {
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-001',
            },
        }

        const result = await provider.handleWebhook(payload)

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            acknowledged: true,
            processed: false,
            providerStatus: 'success',
            status: PAYMENT_DONE_STATUS,
            externalTransactionId: 'paystack-ref-001',
            payload,
            metadata: {
                event: 'charge.success',
                internalStatus: 'confirmed',
                signatureVerified: false,
                stub: true,
            },
            error: null,
        })
    })

    test('returns pending webhook responses for unknown statuses with rationale', async () => {
        const provider = new PaystackPaymentProvider()
        const payload = {
            event: 'charge.dispute.create',
            data: {
                status: 'mystery_state',
                reference: 'paystack-ref-002',
            },
        }

        const result = await provider.handleWebhook(payload)

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            acknowledged: true,
            processed: false,
            providerStatus: 'mystery_state',
            status: PAYMENT_PROCESSING_STATUS,
            externalTransactionId: 'paystack-ref-002',
            payload,
            metadata: {
                event: 'charge.dispute.create',
                internalStatus: 'pending',
                rationale: 'Unknown Paystack status "mystery_state" is treated as pending in stub mode',
                signatureVerified: false,
                stub: true,
            },
            error: null,
        })
    })
})
