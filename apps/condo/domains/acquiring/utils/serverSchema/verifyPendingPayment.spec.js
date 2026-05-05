/**
 * @jest-environment node
 */

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
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
} = require('@condo/domains/acquiring/constants/rentPayment')
const {
    VerifyPendingPaymentError,
    verifyPendingPayment,
} = require('./index')
const { UnknownPaymentProviderError } = require('./paymentProviders')

const sender = { dv: 1, fingerprint: 'test' }

function createJsonResponse (payload, overrides = {}) {
    return {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(payload),
        ...overrides,
    }
}

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
        currencyCode: 'NGN',
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
        currencyCode: 'NGN',
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

describe('verifyPendingPayment', () => {
    const originalPaystackSecret = process.env.PAYSTACK_SECRET_KEY

    beforeEach(() => {
        resetStores()
        jest.clearAllMocks()
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'
        stores.Organization.push({ id: 'organization-1', receiptCode: 'KONDO', deletedAt: null })
    })

    afterAll(() => {
        process.env.PAYSTACK_SECRET_KEY = originalPaystackSecret
    })

    test('confirmed Paystack verification confirms existing pending payment', async () => {
        addRentCharge({ amount: '100', dueDate: '2026-01-01', billingMonth: '2026-01-01' })
        addRentCharge({ amount: '100', dueDate: '2026-02-01', billingMonth: '2026-02-01' })
        const payment = addPendingPayment()
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                amount: '15000',
                currency: 'NGN',
                paid_at: '2026-05-05T00:00:00.000Z',
                reference: 'paystack-ref-1',
            },
        }))

        const result = await verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        }, { fetch })

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
            verification: {
                providerStatus: 'success',
                internalStatus: 'confirmed',
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(2)
        expect(stores.PaymentReceipt).toHaveLength(1)
        expect(stores.LedgerEntry).toHaveLength(1)
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    test('failed Paystack verification marks existing pending payment ERROR without allocation', async () => {
        const payment = addPendingPayment()
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'failed',
                reference: 'paystack-ref-1',
            },
        }))

        const result = await verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        }, { fetch })

        expect(result).toMatchObject({
            processed: true,
            noop: false,
            idempotent: false,
            outcome: 'failed',
            internalStatus: 'failed',
            payment: {
                id: payment.id,
                status: PAYMENT_ERROR_STATUS,
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(0)
        expect(stores.PaymentReceipt).toHaveLength(0)
        expect(stores.LedgerEntry).toHaveLength(0)
    })

    test('pending Paystack verification leaves payment PROCESSING', async () => {
        const payment = addPendingPayment()
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'pending',
                reference: 'paystack-ref-1',
            },
        }))

        const result = await verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        }, { fetch })

        expect(result).toMatchObject({
            processed: true,
            noop: true,
            idempotent: false,
            outcome: 'pending',
            internalStatus: 'pending',
            payment: {
                id: payment.id,
                status: PAYMENT_PROCESSING_STATUS,
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(0)
        expect(stores.PaymentReceipt).toHaveLength(0)
        expect(stores.LedgerEntry).toHaveLength(0)
    })

    test('unknown reference does not create a payment', async () => {
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                reference: 'missing-ref',
            },
        }))

        await expect(verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'missing-ref',
        }, { fetch })).rejects.toMatchObject({
            name: 'VerifyPendingPaymentError',
            code: 'PAYMENT_VERIFICATION_PAYMENT_NOT_FOUND',
        })
        expect(stores.Payment).toHaveLength(0)
        expect(stores.PaymentAllocation).toHaveLength(0)
    })

    test('amount mismatch rejects through confirmPayment', async () => {
        addPendingPayment({ amount: '150', currencyCode: 'NGN' })
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                amount: '14900',
                currency: 'NGN',
                reference: 'paystack-ref-1',
            },
        }))

        await expect(verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        }, { fetch })).rejects.toThrow('Confirmed amount does not match pending payment amount')
        expect(stores.Payment.find(({ providerReference }) => providerReference === 'paystack-ref-1').status).toBe(PAYMENT_PROCESSING_STATUS)
    })

    test('manual provider verification is rejected', async () => {
        await expect(verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_MANUAL,
            providerReference: 'manual-ref-1',
        })).rejects.toMatchObject({
            name: 'VerifyPendingPaymentError',
            code: 'PAYMENT_VERIFICATION_PROVIDER_NOT_SUPPORTED',
            provider: RENT_PAYMENT_PROVIDER_MANUAL,
        })
    })

    test('repeated verification of DONE is idempotent only when metadata matches', async () => {
        addRentCharge({ amount: '150' })
        const payment = addPendingPayment()
        const matchingFetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                amount: '15000',
                currency: 'NGN',
                paid_at: '2026-05-05T00:00:00.000Z',
                reference: 'paystack-ref-1',
            },
        }))

        const firstResult = await verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        }, { fetch: matchingFetch })
        const result = await verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        }, { fetch: matchingFetch })

        expect(firstResult.idempotent).toBe(false)
        expect(result).toMatchObject({
            processed: true,
            noop: false,
            idempotent: true,
            outcome: 'confirmed',
            payment: {
                id: payment.id,
                status: PAYMENT_DONE_STATUS,
            },
        })
        expect(stores.PaymentAllocation).toHaveLength(1)
        expect(stores.PaymentReceipt).toHaveLength(1)

        const mismatchedFetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                amount: '14900',
                currency: 'NGN',
                paid_at: '2026-05-05T00:00:00.000Z',
                reference: 'paystack-ref-1',
            },
        }))

        await expect(verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            paymentId: payment.id,
        }, { fetch: mismatchedFetch })).rejects.toThrow('Confirmed amount does not match pending payment amount')
    })

    test('rejects ambiguous provider reference lookups', async () => {
        addPendingPayment({ id: 'payment-1' })
        addPendingPayment({ id: 'payment-2', externalTransactionId: 'paystack-ref-2' })

        await expect(verifyPendingPayment({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        })).rejects.toMatchObject({
            name: 'VerifyPendingPaymentError',
            code: 'PAYMENT_VERIFICATION_LOOKUP_AMBIGUOUS',
        })
    })

    test('rejects unknown providers', async () => {
        await expect(verifyPendingPayment({}, {
            providerCode: 'unknown-provider',
            providerReference: 'paystack-ref-1',
        })).rejects.toBeInstanceOf(UnknownPaymentProviderError)
    })
})
