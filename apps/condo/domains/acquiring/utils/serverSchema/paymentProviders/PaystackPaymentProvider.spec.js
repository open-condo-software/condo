const https = require('https')
const crypto = require('crypto')

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
            authorizationUrl: null,
            paymentUrl: null,
            externalTransactionId: 'paystack-ref-001',
            paymentData: VALID_PAYMENT_DATA,
            metadata: {
                amountConvention: {
                    internal: {
                        amount: '100.00',
                        unit: 'major',
                    },
                    provider: {
                        amount: '10000',
                        unit: 'subunit',
                    },
                },
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
    function createJsonResponse (payload, overrides = {}) {
        return {
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(payload),
            ...overrides,
        }
    }

    test('verifies a paystack transaction reference through the verification client and maps success to confirmed', async () => {
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                amount: '10000',
                currency: 'NGN',
                paid_at: '2026-05-05T00:00:00.000Z',
                reference: 'paystack-ref-001',
            },
        }))
        const provider = new PaystackPaymentProvider({
            secretKey: 'sk_test_paystack',
            fetch,
        })
        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            paymentMethod: 'card',
        })

        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            confirmed: true,
            confirmedAt: '2026-05-05T00:00:00.000Z',
            amount: '100.00',
            currencyCode: 'NGN',
            status: PAYMENT_DONE_STATUS,
            internalStatus: 'confirmed',
            providerStatus: 'success',
            paymentMethod: 'card',
            externalTransactionId: 'paystack-ref-001',
            paymentData: {
                ...VALID_PAYMENT_DATA,
                paymentMethod: 'card',
            },
            metadata: {
                verification: {
                    endpoint: '/transaction/verify/:reference',
                },
            },
        })
        expect(fetch).toHaveBeenCalledWith(
            'https://api.paystack.co/transaction/verify/paystack-ref-001',
            {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer sk_test_paystack',
                    Accept: 'application/json',
                },
            }
        )
    })

    test('maps failed verification into a stable failed contract', async () => {
        const provider = new PaystackPaymentProvider({
            secretKey: 'sk_test_paystack',
            fetch: jest.fn().mockResolvedValue(createJsonResponse({
                status: true,
                data: {
                    status: 'failed',
                },
            })),
        })

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
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
        const fetch = jest.fn()
            .mockResolvedValueOnce(createJsonResponse({
                status: true,
                data: {
                    status: 'abandoned',
                },
            }))
            .mockResolvedValueOnce(createJsonResponse({
                status: true,
                data: {
                    status: 'pending',
                },
            }))
            .mockResolvedValueOnce(createJsonResponse({
                status: true,
                data: {
                    status: 'ongoing',
                },
            }))
        const provider = new PaystackPaymentProvider({
            secretKey: 'sk_test_paystack',
            fetch,
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'abandoned',
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'pending',
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
        })).resolves.toMatchObject({
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'ongoing',
        })
    })

    test('treats unknown verification status as pending with explicit rationale', async () => {
        const provider = new PaystackPaymentProvider({
            secretKey: 'sk_test_paystack',
            fetch: jest.fn().mockResolvedValue(createJsonResponse({
                status: true,
                data: {
                    status: 'mystery_state',
                },
            })),
        })

        const result = await provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'mystery_state',
            metadata: {
                verification: {
                    endpoint: '/transaction/verify/:reference',
                },
                rationale: 'Unknown Paystack status "mystery_state" is treated as pending in stub mode',
            },
        })
    })

    test('fails typed when the provider reference is missing', async () => {
        const provider = new PaystackPaymentProvider({
            secretKey: 'sk_test_paystack',
            fetch: jest.fn(),
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
            reference: '',
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            field: 'providerReference',
        })
    })

    test('fails typed when the verification request fails', async () => {
        const provider = new PaystackPaymentProvider({
            secretKey: 'sk_test_paystack',
            fetch: jest.fn().mockRejectedValue(new Error('network down')),
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
        })).rejects.toMatchObject({
            name: 'PaymentProviderRequestError',
            code: 'PAYMENT_PROVIDER_REQUEST_FAILED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            operation: 'verifyTransaction',
        })
    })

    test('fails typed when the verification response is malformed', async () => {
        const provider = new PaystackPaymentProvider({
            secretKey: 'sk_test_paystack',
            fetch: jest.fn().mockResolvedValue(createJsonResponse({
                status: true,
                message: 'ok',
            })),
        })

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
        })).rejects.toMatchObject({
            name: 'PaymentProviderResponseError',
            code: 'PAYMENT_PROVIDER_MALFORMED_RESPONSE',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            operation: 'verifyTransaction',
        })
    })

    test('fails safely when verification credentials are missing', async () => {
        const provider = new PaystackPaymentProvider()

        await expect(provider.verifyPayment({
            ...VALID_PAYMENT_DATA,
        })).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })
    })
})

describe('PaystackPaymentProvider.handleWebhook', () => {
    test('verifies a valid Paystack webhook signature from raw body and headers', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })
        const rawBody = JSON.stringify({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-001',
            },
        })
        const signature = crypto
            .createHmac('sha512', 'sk_test_paystack')
            .update(rawBody)
            .digest('hex')

        const result = await provider.verifyWebhookSignature(JSON.parse(rawBody), {
            rawBody,
            headers: {
                'x-paystack-signature': signature,
            },
        })

        expect(result).toEqual({
            signatureVerified: true,
            signatureVerificationRequired: true,
            signatureVerificationReason: 'Paystack signature verified successfully',
        })
    })

    test('marks invalid Paystack webhook signatures as unverified', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        const result = await provider.verifyWebhookSignature({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-001',
            },
        }, {
            rawBody: JSON.stringify({
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-001',
                },
            }),
            headers: {
                'x-paystack-signature': 'invalid-signature',
            },
        })

        expect(result).toEqual({
            signatureVerified: false,
            signatureVerificationRequired: true,
            signatureVerificationReason: 'Paystack signature does not match the webhook payload',
        })
    })

    test('marks missing Paystack webhook signatures as unverified', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })

        const result = await provider.verifyWebhookSignature({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-001',
            },
        }, {
            rawBody: JSON.stringify({
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-001',
                },
            }),
            headers: {},
        })

        expect(result).toEqual({
            signatureVerified: false,
            signatureVerificationRequired: true,
            signatureVerificationReason: 'Paystack signature header is missing',
        })
    })

    test('returns a stable webhook response shape for success events', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })
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
            internalStatus: 'confirmed',
            externalTransactionId: 'paystack-ref-001',
            payload,
            metadata: {
                event: 'charge.success',
                amountConvention: {
                    internalUnit: 'major',
                    providerUnit: 'subunit',
                    providerCurrency: null,
                },
                internalStatus: 'confirmed',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
                stub: true,
            },
            error: null,
        })
    })

    test('returns pending webhook responses for unknown statuses with rationale', async () => {
        const provider = new PaystackPaymentProvider({ secretKey: 'sk_test_paystack' })
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
            internalStatus: 'pending',
            externalTransactionId: 'paystack-ref-002',
            payload,
            metadata: {
                event: 'charge.dispute.create',
                amountConvention: {
                    internalUnit: 'major',
                    providerUnit: 'subunit',
                    providerCurrency: null,
                },
                internalStatus: 'pending',
                rationale: 'Unknown Paystack status "mystery_state" is treated as pending in stub mode',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
                stub: true,
            },
            error: null,
        })
    })
})
