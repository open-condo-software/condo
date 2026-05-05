/**
 * @jest-environment node
 */

const crypto = require('crypto')

const mockFind = jest.fn(async () => [])
const mockGetById = jest.fn(async () => null)

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getById: mockGetById,
}))

jest.mock('@open-condo/codegen/generate.server.utils', () => ({
    execGqlWithoutAccess: jest.fn(),
    generateServerUtils: jest.fn(() => ({
        create: jest.fn(),
        update: jest.fn(),
        getOne: jest.fn(),
    })),
}))

const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')
const {
    handleProviderWebhookRequest,
} = require('./index')
const {
    adaptProviderWebhookRequest,
    dispatchProviderWebhookRequest,
    normalizeWebhookHeaders,
    ProviderWebhookAdapterError,
} = require('./providerWebhookAdapter')
const { UnknownPaymentProviderError } = require('./paymentProviders')

describe('providerWebhookAdapter', () => {
    const originalPaystackSecret = process.env.PAYSTACK_SECRET_KEY

    beforeEach(() => {
        jest.clearAllMocks()
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'
    })

    afterAll(() => {
        process.env.PAYSTACK_SECRET_KEY = originalPaystackSecret
    })

    test('normalizes webhook headers case-insensitively', () => {
        expect(normalizeWebhookHeaders({
            'X-Paystack-Signature': 'signature',
            'Content-Type': 'application/json',
        })).toEqual({
            'content-type': 'application/json',
            'x-paystack-signature': 'signature',
        })
    })

    test('rejects missing provider code before dispatch', () => {
        expect(() => adaptProviderWebhookRequest({
            payload: {},
        })).toThrow(ProviderWebhookAdapterError)
        expect(() => adaptProviderWebhookRequest({
            payload: {},
        })).toThrow('Provider code is required for provider webhook handling')
    })

    test('rejects unknown providers through the registry', () => {
        expect(() => adaptProviderWebhookRequest({
            providerCode: 'unknown-provider',
            payload: {},
        })).toThrow(UnknownPaymentProviderError)
    })

    test('passes normalized headers and raw body to the webhook handler without mutating payments directly', async () => {
        const rawBody = JSON.stringify({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-adapter-1',
            },
        })
        const handler = jest.fn(async (context, data) => ({ context, data }))

        const result = await dispatchProviderWebhookRequest({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            parsedPayload: JSON.parse(rawBody),
            rawBody,
            headers: {
                'X-Paystack-Signature': 'mixed-case-signature',
            },
        }, handler)

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith({}, expect.objectContaining({
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: JSON.parse(rawBody),
            metadata: expect.objectContaining({
                rawBody,
                headers: {
                    'x-paystack-signature': 'mixed-case-signature',
                },
            }),
        }))
        expect(result.data.payment).toBeUndefined()
    })

    test('passes raw body and mixed-case Paystack signature header into provider verification', async () => {
        const rawBody = JSON.stringify({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-adapter-2',
                domain: 'live',
            },
        })
        const signature = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(rawBody)
            .digest('hex')

        const result = await handleProviderWebhookRequest({}, {
            params: {
                providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            },
            parsedPayload: JSON.parse(rawBody),
            rawBody,
            headers: {
                'X-Paystack-Signature': signature,
            },
            mode: 'production',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            processed: false,
            noop: true,
            code: 'PAYMENT_WEBHOOK_PAYMENT_NOT_FOUND',
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                signatureVerified: true,
                signatureVerificationRequired: true,
            },
        })
    })

    test('rejects Paystack webhook without raw body in production mode', async () => {
        const result = await handleProviderWebhookRequest({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            parsedPayload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-adapter-3',
                    domain: 'live',
                },
            },
            headers: {
                'x-paystack-signature': 'signature-without-body',
            },
            mode: 'production',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            processed: false,
            noop: true,
            code: 'PAYMENT_WEBHOOK_SIGNATURE_REJECTED',
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack webhook raw body is unavailable for signature verification',
            },
        })
    })

    test('accepts missing Paystack raw body in test mode only as unverified', async () => {
        const result = await handleProviderWebhookRequest({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            parsedPayload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-adapter-4',
                    domain: 'test',
                },
            },
            headers: {
                'x-paystack-signature': 'signature-without-body',
            },
            mode: 'test',
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            processed: false,
            noop: true,
            code: 'PAYMENT_WEBHOOK_PAYMENT_NOT_FOUND',
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack webhook raw body is unavailable for signature verification',
            },
        })
    })
})
