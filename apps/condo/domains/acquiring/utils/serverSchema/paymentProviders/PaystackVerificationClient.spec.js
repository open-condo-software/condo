const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')

const {
    convertMajorAmountToPaystackSubunits,
    convertPaystackSubunitsToMajorAmount,
    createPaystackVerificationClient,
} = require('./PaystackVerificationClient')

function createJsonResponse (payload, overrides = {}) {
    return {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(payload),
        ...overrides,
    }
}

describe('PaystackVerificationClient', () => {
    test('maps a success response to a confirmed provider-normalised result', async () => {
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                amount: '15000',
                currency: 'NGN',
                paid_at: '2026-05-05T00:00:00.000Z',
                reference: 'paystack-ref-001',
            },
        }))
        const client = createPaystackVerificationClient({ fetch })

        const result = await client.verifyTransaction({
            providerReference: 'paystack-ref-001',
            secretKey: 'sk_test_paystack',
            paymentMethod: 'card',
            paymentData: {
                providerReference: 'paystack-ref-001',
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
        expect(result).toEqual({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            confirmed: true,
            confirmedAt: '2026-05-05T00:00:00.000Z',
            amount: '150.00',
            currencyCode: 'NGN',
            status: PAYMENT_DONE_STATUS,
            internalStatus: 'confirmed',
            providerStatus: 'success',
            paymentMethod: 'card',
            externalTransactionId: 'paystack-ref-001',
            paymentData: {
                providerReference: 'paystack-ref-001',
            },
            metadata: {
                verification: {
                    endpoint: '/transaction/verify/:reference',
                },
            },
        })
    })

    test('maps a failed response to failed', async () => {
        const client = createPaystackVerificationClient({
            fetch: jest.fn().mockResolvedValue(createJsonResponse({
                status: true,
                data: {
                    status: 'failed',
                },
            })),
        })

        await expect(client.verifyTransaction({
            providerReference: 'paystack-ref-001',
            secretKey: 'sk_test_paystack',
        })).resolves.toMatchObject({
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_ERROR_STATUS,
            internalStatus: 'failed',
            providerStatus: 'failed',
        })
    })

    test('maps pending and abandoned responses to pending', async () => {
        const fetch = jest.fn()
            .mockResolvedValueOnce(createJsonResponse({
                status: true,
                data: {
                    status: 'pending',
                },
            }))
            .mockResolvedValueOnce(createJsonResponse({
                status: true,
                data: {
                    status: 'abandoned',
                },
            }))
        const client = createPaystackVerificationClient({ fetch })

        await expect(client.verifyTransaction({
            providerReference: 'paystack-ref-pending',
            secretKey: 'sk_test_paystack',
        })).resolves.toMatchObject({
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'pending',
        })

        await expect(client.verifyTransaction({
            providerReference: 'paystack-ref-abandoned',
            secretKey: 'sk_test_paystack',
        })).resolves.toMatchObject({
            confirmed: false,
            confirmedAt: null,
            status: PAYMENT_PROCESSING_STATUS,
            internalStatus: 'pending',
            providerStatus: 'abandoned',
        })
    })

    test('fails typed when providerReference is missing', async () => {
        const client = createPaystackVerificationClient({
            fetch: jest.fn(),
        })

        await expect(client.verifyTransaction({
            providerReference: '',
            secretKey: 'sk_test_paystack',
        })).rejects.toMatchObject({
            name: 'PaymentProviderValidationError',
            code: 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            field: 'providerReference',
        })
    })

    test('fails typed when secret key is missing', async () => {
        const client = createPaystackVerificationClient({
            fetch: jest.fn(),
        })

        await expect(client.verifyTransaction({
            providerReference: 'paystack-ref-001',
            secretKey: '',
        })).rejects.toMatchObject({
            name: 'PaymentProviderConfigurationError',
            code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })
    })

    test('fails typed on HTTP failures', async () => {
        const client = createPaystackVerificationClient({
            fetch: jest.fn().mockRejectedValue(new Error('socket hang up')),
        })

        await expect(client.verifyTransaction({
            providerReference: 'paystack-ref-001',
            secretKey: 'sk_test_paystack',
        })).rejects.toMatchObject({
            name: 'PaymentProviderRequestError',
            code: 'PAYMENT_PROVIDER_REQUEST_FAILED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            operation: 'verifyTransaction',
        })
    })

    test('fails typed on malformed responses', async () => {
        const client = createPaystackVerificationClient({
            fetch: jest.fn().mockResolvedValue(createJsonResponse({
                status: true,
                message: 'ok',
            })),
        })

        await expect(client.verifyTransaction({
            providerReference: 'paystack-ref-001',
            secretKey: 'sk_test_paystack',
        })).rejects.toMatchObject({
            name: 'PaymentProviderResponseError',
            code: 'PAYMENT_PROVIDER_MALFORMED_RESPONSE',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            operation: 'verifyTransaction',
        })
    })

    test('does not leak secret-bearing provider messages into surfaced errors', async () => {
        const client = createPaystackVerificationClient({
            fetch: jest.fn().mockResolvedValue(createJsonResponse({
                status: false,
                message: 'Authorization Bearer sk_test_paystack rejected',
            }, {
                ok: false,
                status: 401,
            })),
        })

        await expect(client.verifyTransaction({
            providerReference: 'paystack-ref-001',
            secretKey: 'sk_test_paystack',
        })).rejects.toMatchObject({
            name: 'PaymentProviderRequestError',
            message: 'Paystack verification request failed with status 401',
        })
    })

    test('converts between internal major units and Paystack subunits explicitly', () => {
        expect(convertMajorAmountToPaystackSubunits('150', 'NGN')).toBe('15000')
        expect(convertPaystackSubunitsToMajorAmount('15000', 'NGN')).toBe('150.00')
    })
})
