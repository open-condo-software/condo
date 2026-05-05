const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RENT_PAYMENT_METHOD_CASH,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
} = require('@condo/domains/acquiring/constants/rentPayment')

const { HubtelPaymentProvider } = require('./HubtelPaymentProvider')
const { ManualPaymentProvider } = require('./ManualPaymentProvider')
const {
    PaymentProvider,
    PROVIDER_CONTRACT_METHODS,
    ensurePaymentProviderContract,
} = require('./PaymentProvider')
const { PaystackPaymentProvider } = require('./PaystackPaymentProvider')

describe('payment provider contract', () => {
    test('enforces the provider contract shape', () => {
        expect(ensurePaymentProviderContract(new ManualPaymentProvider())).toBe(true)
        expect(ensurePaymentProviderContract(new PaystackPaymentProvider())).toBe(true)
        expect(ensurePaymentProviderContract(new HubtelPaymentProvider())).toBe(true)

        expect(() => ensurePaymentProviderContract({})).toThrow('Payment provider contract requires method "initializePayment"')
        expect(PROVIDER_CONTRACT_METHODS).toEqual([
            'initializePayment',
            'verifyPayment',
            'handleWebhook',
            'normaliseProviderStatus',
            'mapProviderReference',
        ])
    })

    test('manual provider conforms to the contract and normalises confirmed status', async () => {
        const provider = new ManualPaymentProvider()
        const result = await provider.verifyPayment({
            paymentMethod: RENT_PAYMENT_METHOD_CASH,
            reference: 'manual-ref-001',
            confirmedAt: '2026-05-05T00:00:00.000Z',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_MANUAL,
            confirmed: true,
            confirmedAt: '2026-05-05T00:00:00.000Z',
            paymentMethod: RENT_PAYMENT_METHOD_CASH,
            externalTransactionId: 'manual-ref-001',
            providerStatus: 'manual_confirmed',
            status: PAYMENT_DONE_STATUS,
        })
        expect(provider.normaliseProviderStatus('manual_created')).toBe(PAYMENT_INIT_STATUS)
    })

    test('provider statuses normalise into internal payment statuses', () => {
        const provider = new PaystackPaymentProvider()
        const hubtelProvider = new HubtelPaymentProvider()

        expect(provider.normaliseProviderStatus('pending')).toBe(PAYMENT_PROCESSING_STATUS)
        expect(provider.normaliseProviderStatus('success')).toBe(PAYMENT_DONE_STATUS)
        expect(provider.normaliseProviderStatus('failed')).toBe(PAYMENT_ERROR_STATUS)
        expect(provider.normaliseProviderStatus('abandoned')).toBe(PAYMENT_PROCESSING_STATUS)
        expect(provider.normaliseProviderStatus('ongoing')).toBe(PAYMENT_PROCESSING_STATUS)
        expect(provider.normaliseProviderStatus('unknown')).toBeNull()
        expect(hubtelProvider.normaliseProviderStatus('pending')).toBe(PAYMENT_PROCESSING_STATUS)
        expect(hubtelProvider.normaliseProviderStatus('successful')).toBe(PAYMENT_DONE_STATUS)
        expect(hubtelProvider.normaliseProviderStatus('rejected')).toBeNull()
        expect(hubtelProvider.normaliseProviderStatus('queued')).toBe(PAYMENT_PROCESSING_STATUS)
    })

    test('provider references map consistently', () => {
        const manualProvider = new ManualPaymentProvider()
        const paystackProvider = new PaystackPaymentProvider()
        const hubtelProvider = new HubtelPaymentProvider()

        expect(manualProvider.mapProviderReference({
            reference: 'manual-priority-ref',
            externalTransactionId: 'manual-fallback-ref',
        })).toBe('manual-priority-ref')
        expect(manualProvider.mapProviderReference({
            externalTransactionId: 'manual-fallback-ref',
        })).toBe('manual-fallback-ref')
        expect(paystackProvider.mapProviderReference({
            data: {
                reference: 'paystack-ref-001',
                id: 42,
            },
        })).toBe('paystack-ref-001')
        expect(hubtelProvider.mapProviderReference({
            data: {
                checkoutId: 'hubtel-ref-001',
                id: 77,
            },
        })).toBe('hubtel-ref-001')
        expect(paystackProvider.mapProviderReference('paystack-raw-ref')).toBe('paystack-raw-ref')
    })

    test('stubbed verification still fails explicitly when provider credentials are missing', async () => {
        const provider = new PaystackPaymentProvider()

        await expect(provider.initializePayment({
            amount: '100.00',
            currency: 'NGN',
            payer: {
                email: 'resident@example.com',
            },
            organization: {
                id: 'organization-1',
            },
        })).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })
        await expect(provider.verifyPayment({ reference: 'paystack-ref-001' })).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })
    })

    test('stubbed verification returns a stable confirmed response shape', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        const result = await provider.verifyPayment({
            paymentMethod: 'card',
            reference: 'paystack-ref-001',
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
                paymentMethod: 'card',
                reference: 'paystack-ref-001',
                providerStatus: 'success',
                confirmedAt: '2026-05-05T00:00:00.000Z',
            },
            metadata: {
                stub: true,
            },
        })
    })

    test('webhook handling returns a stable response structure', async () => {
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

    test('unknown webhook statuses stay pending with explicit rationale', async () => {
        const provider = new PaystackPaymentProvider()
        const payload = {
            event: 'charge.dispute.create',
            data: {
                status: 'unknown',
                reference: 'paystack-ref-002',
            },
        }

        const result = await provider.handleWebhook(payload)

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            acknowledged: true,
            processed: false,
            providerStatus: 'unknown',
            status: PAYMENT_PROCESSING_STATUS,
            externalTransactionId: 'paystack-ref-002',
            payload,
            metadata: {
                event: 'charge.dispute.create',
                internalStatus: 'pending',
                rationale: 'Unknown Paystack status "unknown" is treated as pending in stub mode',
                signatureVerified: false,
                stub: true,
            },
            error: null,
        })
    })

    test('legacy compatibility methods delegate to the new contract', async () => {
        const provider = new ManualPaymentProvider()
        const initResult = await provider.createPayment({
            paymentMethod: RENT_PAYMENT_METHOD_CASH,
            reference: 'legacy-init-ref',
        })
        const webhookResult = await provider.parseWebhook({ providerStatus: 'ignored' })

        expect(initResult.status).toBe(PAYMENT_INIT_STATUS)
        expect(initResult.externalTransactionId).toBe('legacy-init-ref')
        expect(webhookResult).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_MANUAL,
            acknowledged: true,
            processed: false,
            payload: { providerStatus: 'ignored' },
        })
    })

    test('base provider returns a stable unsupported webhook response', async () => {
        const provider = new PaymentProvider({ provider: 'test' })
        const result = await provider.handleWebhook({ id: 'webhook-1' })

        expect(result).toEqual({
            provider: 'test',
            acknowledged: true,
            processed: false,
            providerStatus: null,
            status: null,
            externalTransactionId: 'webhook-1',
            payload: { id: 'webhook-1' },
            metadata: {
                unsupported: true,
            },
            error: null,
        })
    })
})
