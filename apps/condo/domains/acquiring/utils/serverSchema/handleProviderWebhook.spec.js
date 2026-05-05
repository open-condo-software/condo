/**
 * @jest-environment node
 */

const crypto = require('crypto')

const stores = {}
const counters = {}

function resetStores () {
    for (const listKey of ['Organization', 'Payment', 'TenantLedger', 'LedgerEntry', 'PaymentAllocation', 'PaymentReceipt', 'RentCharge']) {
        stores[listKey] = []
        counters[listKey] = 0
    }
}

function getRelationId (value) {
    return value && value.id ? value.id : value
}

function flattenRelations (data) {
    const result = { ...data }

    for (const [key, value] of Object.entries(result)) {
        if (value && value.connect && value.connect.id) {
            result[key] = value.connect.id
        }
    }

    return result
}

function matchesWhere (item, where) {
    return Object.entries(where).every(([key, value]) => {
        if (key === 'deletedAt') return item.deletedAt === value
        if (key.endsWith('_not')) return item[key.slice(0, -4)] !== value
        if (value && typeof value === 'object' && value.id) return getRelationId(item[key]) === value.id
        return item[key] === value
    })
}

const mockFind = jest.fn(async (listKey, where) => stores[listKey].filter(item => matchesWhere(item, where)))
const mockGetById = jest.fn(async (listKey, id) => stores[listKey].find(item => item.id === id) || null)

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getById: mockGetById,
}))

jest.mock('@open-condo/codegen/generate.server.utils', () => ({
    execGqlWithoutAccess: jest.fn(),
    generateServerUtils: jest.fn((listKey) => ({
        create: jest.fn(async (context, data) => {
            counters[listKey] += 1
            const item = {
                id: `${listKey}-${counters[listKey]}`,
                ...flattenRelations(data),
                deletedAt: null,
            }
            stores[listKey].push(item)
            return item
        }),
        update: jest.fn(async (context, id, data) => {
            const item = stores[listKey].find(item => item.id === id)
            Object.assign(item, flattenRelations(data))

            if (listKey === 'Payment' && item.status === 'DONE' && item.tenant) {
                const { processConfirmedRentPayment } = require('@condo/domains/billing/utils/serverSchema/paymentAllocation')
                await processConfirmedRentPayment(context, item)
            }

            return item
        }),
        getOne: jest.fn(),
    })),
}))

const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
} = require('@condo/domains/acquiring/constants/rentPayment')
const {
    handleProviderWebhook,
    ProviderWebhookHandlingError,
} = require('./index')
const { UnknownPaymentProviderError } = require('./paymentProviders')

const sender = { dv: 1, fingerprint: 'test' }

function addPendingPayment (attrs = {}) {
    const payment = {
        id: `payment-${stores.Payment.length + 1}`,
        dv: 1,
        sender,
        organization: 'organization-1',
        tenant: 'tenant-1',
        occupancy: 'occupancy-1',
        property: 'property-1',
        rentalUnit: 'rental-unit-1',
        amount: '150',
        currencyCode: 'GHS',
        provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        providerReference: 'paystack-ref-1',
        externalTransactionId: 'paystack-ref-1',
        status: PAYMENT_PROCESSING_STATUS,
        confirmedAt: null,
        advancedAt: null,
        deletedAt: null,
        ...attrs,
    }

    stores.Payment.push(payment)
    return payment
}

function addRentCharge (attrs = {}) {
    const index = stores.RentCharge.length + 1
    const rentCharge = {
        id: `charge-${index}`,
        organization: 'organization-1',
        tenant: 'tenant-1',
        property: 'property-1',
        rentalUnit: 'rental-unit-1',
        occupancy: 'occupancy-1',
        amount: '100',
        currencyCode: 'GHS',
        status: 'invoiced',
        dueDate: `2026-0${index}-01`,
        billingMonth: `2026-0${index}-01`,
        sender,
        deletedAt: null,
        ...attrs,
    }
    stores.RentCharge.push(rentCharge)
    return rentCharge
}

describe('handleProviderWebhook', () => {
    const originalPaystackSecret = process.env.PAYSTACK_SECRET_KEY
    const originalHubtelSecret = process.env.HUBTEL_SECRET_KEY

    beforeEach(() => {
        resetStores()
        jest.clearAllMocks()
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'
        process.env.HUBTEL_SECRET_KEY = 'hubtel_test_secret'
        stores.Organization.push({ id: 'organization-1', receiptCode: 'KONDO', deletedAt: null })
    })

    afterAll(() => {
        process.env.PAYSTACK_SECRET_KEY = originalPaystackSecret
        process.env.HUBTEL_SECRET_KEY = originalHubtelSecret
    })

    test('confirms an existing pending Paystack payment on success webhook', async () => {
        addRentCharge({ amount: '100', dueDate: '2026-01-01', billingMonth: '2026-01-01' })
        addRentCharge({ amount: '100', dueDate: '2026-02-01', billingMonth: '2026-02-01' })
        const payment = addPendingPayment()

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-1',
                },
            },
        })

        expect(result).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            processed: true,
            noop: false,
            idempotent: false,
            outcome: 'confirmed',
            internalStatus: 'confirmed',
            payment: {
                id: payment.id,
                status: PAYMENT_DONE_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'success',
                internalStatus: 'confirmed',
                actionTaken: 'confirmed',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(2)
        expect(stores.PaymentReceipt).toHaveLength(1)
        expect(stores.LedgerEntry).toHaveLength(1)
    })

    test('confirms an existing pending Hubtel payment on success webhook', async () => {
        addRentCharge({ amount: '150' })
        const payment = addPendingPayment({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            providerReference: 'hubtel-ref-1',
            externalTransactionId: 'hubtel-ref-1',
        })

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_HUBTEL,
            payload: {
                status: 'Successful',
                data: {
                    clientReference: 'hubtel-ref-1',
                },
            },
        })

        expect(result.payment).toMatchObject({
            id: payment.id,
            status: PAYMENT_DONE_STATUS,
        })
        expect(stores.PaymentAllocation).toHaveLength(1)
        expect(stores.PaymentReceipt).toHaveLength(1)
    })

    test('moves PROCESSING payments to ERROR on failed webhook without allocation', async () => {
        const payment = addPendingPayment()

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                data: {
                    status: 'failed',
                    reference: 'paystack-ref-1',
                },
            },
        })

        expect(result).toMatchObject({
            processed: true,
            noop: false,
            outcome: 'failed',
            internalStatus: 'failed',
            payment: {
                id: payment.id,
                status: PAYMENT_ERROR_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'failed',
                internalStatus: 'failed',
                actionTaken: 'failed',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(0)
        expect(stores.PaymentReceipt).toHaveLength(0)
        expect(stores.LedgerEntry).toHaveLength(0)
    })

    test('leaves PROCESSING payment unchanged on pending webhook', async () => {
        const payment = addPendingPayment()

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                data: {
                    status: 'pending',
                    reference: 'paystack-ref-1',
                },
            },
        })

        expect(result).toMatchObject({
            processed: true,
            noop: true,
            outcome: 'pending',
            internalStatus: 'pending',
            payment: {
                id: payment.id,
                status: PAYMENT_PROCESSING_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'pending',
                internalStatus: 'pending',
                actionTaken: 'pending_noop',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(0)
        expect(stores.PaymentReceipt).toHaveLength(0)
        expect(stores.LedgerEntry).toHaveLength(0)
    })

    test('returns a typed no-op when webhook reference does not match an existing payment', async () => {
        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'missing-ref',
                },
            },
        })

        expect(result).toEqual(expect.objectContaining({
            processed: false,
            noop: true,
            code: 'PAYMENT_WEBHOOK_PAYMENT_NOT_FOUND',
            outcome: 'not_found',
            internalStatus: 'confirmed',
            payment: null,
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'success',
                internalStatus: 'confirmed',
                actionTaken: 'rejected',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        }))
        expect(stores.Payment).toHaveLength(0)
        expect(stores.PaymentAllocation).toHaveLength(0)
    })

    test('treats duplicate success webhooks idempotently', async () => {
        addRentCharge({ amount: '150' })
        const payment = addPendingPayment()

        const firstResult = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-1',
                },
            },
        })
        const secondResult = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-1',
                },
            },
        })

        expect(firstResult.idempotent).toBe(false)
        expect(secondResult).toMatchObject({
            processed: true,
            noop: false,
            idempotent: true,
            outcome: 'confirmed',
            payment: {
                id: payment.id,
                status: PAYMENT_DONE_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'success',
                internalStatus: 'confirmed',
                actionTaken: 'duplicate_noop',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(1)
        expect(stores.PaymentReceipt).toHaveLength(1)
        expect(stores.LedgerEntry).toHaveLength(1)
    })

    test('rejects failed webhook for a DONE payment with explicit conflict metadata', async () => {
        const payment = addPendingPayment({
            status: PAYMENT_DONE_STATUS,
            confirmedAt: '2026-05-01T00:00:00.000Z',
            advancedAt: '2026-05-01T00:00:00.000Z',
        })

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                data: {
                    status: 'failed',
                    reference: 'paystack-ref-1',
                },
            },
        })

        expect(result).toMatchObject({
            processed: false,
            noop: true,
            idempotent: false,
            code: 'PAYMENT_WEBHOOK_FAILURE_REJECTED',
            outcome: 'conflict',
            internalStatus: 'failed',
            payment: {
                id: payment.id,
                status: PAYMENT_DONE_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'failed',
                internalStatus: 'failed',
                actionTaken: 'rejected',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
    })

    test('rejects confirmed webhook for an ERROR payment when no recovery flow exists', async () => {
        const payment = addPendingPayment({
            status: PAYMENT_ERROR_STATUS,
        })

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-1',
                },
            },
        })

        expect(result).toMatchObject({
            processed: false,
            noop: true,
            idempotent: false,
            code: 'PAYMENT_WEBHOOK_CONFIRMATION_REJECTED',
            outcome: 'rejected',
            internalStatus: 'confirmed',
            payment: {
                id: payment.id,
                status: PAYMENT_ERROR_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'success',
                internalStatus: 'confirmed',
                actionTaken: 'rejected',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
    })

    test('keeps ERROR payment unchanged on pending webhook', async () => {
        const payment = addPendingPayment({
            status: PAYMENT_ERROR_STATUS,
        })

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                data: {
                    status: 'pending',
                    reference: 'paystack-ref-1',
                },
            },
        })

        expect(result).toMatchObject({
            processed: true,
            noop: true,
            idempotent: false,
            code: 'PAYMENT_WEBHOOK_PENDING_ERROR_NOOP',
            outcome: 'pending',
            internalStatus: 'pending',
            payment: {
                id: payment.id,
                status: PAYMENT_ERROR_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'pending',
                internalStatus: 'pending',
                actionTaken: 'pending_noop',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
    })

    test('preserves amount and currency validation before webhook confirmation', async () => {
        addPendingPayment({
            amount: '150',
            currencyCode: 'GHS',
        })

        await expect(async () => {
            try {
                await handleProviderWebhook({}, {
                    providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
                    payload: {
                        event: 'charge.success',
                        data: {
                            status: 'success',
                            reference: 'paystack-ref-1',
                            amount: '14900',
                            currency: 'USD',
                        },
                    },
                })
            } catch (error) {
                expect(error.message).toBe('Confirmed amount does not match pending payment amount')
                throw error
            }
        }).rejects.toThrow('Confirmed amount does not match pending payment amount')
    })

    test('converts Paystack webhook subunit amounts into internal major units before confirmation', async () => {
        addRentCharge({ amount: '150' })
        const payment = addPendingPayment({
            amount: '150',
            currencyCode: 'NGN',
        })
        const rawBody = JSON.stringify({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-1',
                amount: '15000',
                currency: 'NGN',
            },
        })
        const signature = crypto
            .createHmac('sha512', 'sk_test_paystack')
            .update(rawBody)
            .digest('hex')

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: JSON.parse(rawBody),
            environment: 'production',
            metadata: {
                rawBody,
                headers: {
                    'x-paystack-signature': signature,
                },
            },
        })

        expect(result).toMatchObject({
            processed: true,
            outcome: 'confirmed',
            payment: {
                id: payment.id,
                status: PAYMENT_DONE_STATUS,
                amount: '150',
                currencyCode: 'NGN',
            },
        })
    })

    test('accepts unsigned Paystack test-mode webhooks with explicit unverified metadata', async () => {
        addRentCharge({ amount: '150' })
        const payment = addPendingPayment()

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                livemode: false,
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-1',
                },
            },
            environment: 'test',
        })

        expect(result).toMatchObject({
            processed: true,
            outcome: 'confirmed',
            payment: {
                id: payment.id,
                status: PAYMENT_DONE_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
    })

    test('rejects unsigned Paystack production-mode webhooks before state changes', async () => {
        const payment = addPendingPayment()

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'paystack-ref-1',
                },
            },
            environment: 'production',
        })

        expect(result).toMatchObject({
            processed: false,
            noop: true,
            code: 'PAYMENT_WEBHOOK_SIGNATURE_REJECTED',
            outcome: 'rejected',
            payment: null,
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                actionTaken: 'rejected',
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            },
        })
        expect(stores.Payment.find(({ id }) => id === payment.id).status).toBe(PAYMENT_PROCESSING_STATUS)
        expect(stores.PaymentAllocation).toHaveLength(0)
        expect(stores.PaymentReceipt).toHaveLength(0)
    })

    test('rejects invalid Paystack signatures in test mode', async () => {
        addPendingPayment()
        const rawBody = JSON.stringify({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-1',
            },
        })

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: JSON.parse(rawBody),
            environment: 'test',
            metadata: {
                rawBody,
                headers: {
                    'x-paystack-signature': 'invalid-signature',
                },
            },
        })

        expect(result).toMatchObject({
            processed: false,
            noop: true,
            code: 'PAYMENT_WEBHOOK_SIGNATURE_REJECTED',
            outcome: 'rejected',
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature does not match the webhook payload',
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(0)
    })

    test('accepts valid Paystack signatures and marks metadata as verified', async () => {
        addRentCharge({ amount: '150' })
        const payment = addPendingPayment()
        const rawBody = JSON.stringify({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-1',
            },
        })
        const signature = crypto
            .createHmac('sha512', 'sk_test_paystack')
            .update(rawBody)
            .digest('hex')

        const result = await handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: JSON.parse(rawBody),
            environment: 'production',
            metadata: {
                rawBody,
                headers: {
                    'x-paystack-signature': signature,
                },
            },
        })

        expect(result).toMatchObject({
            processed: true,
            outcome: 'confirmed',
            payment: {
                id: payment.id,
                status: PAYMENT_DONE_STATUS,
            },
            metadata: {
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                signatureVerified: true,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature verified successfully',
            },
        })
    })

    test('fails with a typed error when webhook payment lookup is ambiguous', async () => {
        addPendingPayment({
            id: 'payment-1',
            providerReference: 'ambiguous-ref',
            externalTransactionId: 'ambiguous-ref',
        })
        addPendingPayment({
            id: 'payment-2',
            providerReference: 'ambiguous-ref',
            externalTransactionId: 'ambiguous-ref-2',
        })

        await expect(handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {
                event: 'charge.success',
                data: {
                    status: 'success',
                    reference: 'ambiguous-ref',
                },
            },
        })).rejects.toMatchObject({
            name: 'ProviderWebhookHandlingError',
            code: 'PAYMENT_WEBHOOK_LOOKUP_AMBIGUOUS',
        })
    })

    test('rejects unknown providers', async () => {
        await expect(handleProviderWebhook({}, {
            providerCode: 'unknown-provider',
            payload: {},
        })).rejects.toThrow(UnknownPaymentProviderError)
    })

    test('rejects unconfigured providers', async () => {
        delete process.env.PAYSTACK_SECRET_KEY

        await expect(handleProviderWebhook({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            payload: {},
        })).rejects.toMatchObject({
            name: 'ProviderWebhookHandlingError',
            code: 'PAYMENT_WEBHOOK_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })
        expect(ProviderWebhookHandlingError).toBeDefined()
    })
})
