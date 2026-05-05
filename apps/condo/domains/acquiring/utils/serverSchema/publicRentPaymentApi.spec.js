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
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
} = require('@condo/domains/acquiring/constants/rentPayment')
const {
    handleProviderWebhookRequestPublic,
    initiateRentPaymentPublic,
    verifyPendingPaymentPublic,
} = require('./index')
const { UnknownPaymentProviderError } = require('./paymentProviders')

const sender = { dv: 1, fingerprint: 'test' }
const baseInitiationData = {
    dv: 1,
    sender,
    organization: { id: 'organization-1' },
    tenant: { id: 'tenant-1' },
    amount: '125.50',
    currency: 'GHS',
    payerContact: {
        email: 'resident@example.com',
        phone: '+233000000000',
    },
    rentContext: {
        id: 'rent-context-1',
    },
}

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

function expectOnlyPublicFields (result) {
    expect(Object.keys(result).sort()).toEqual([
        'actionTaken',
        'amount',
        'authorizationUrl',
        'currency',
        'paymentId',
        'paymentUrl',
        'provider',
        'providerReference',
        'status',
    ])
}

describe('public rent payment API wrappers', () => {
    const originalPaystackSecret = process.env.PAYSTACK_SECRET_KEY
    const originalHubtelSecret = process.env.HUBTEL_SECRET_KEY
    const originalHubtelApiKey = process.env.HUBTEL_API_KEY

    beforeEach(() => {
        resetStores()
        jest.clearAllMocks()
        delete process.env.PAYSTACK_SECRET_KEY
        delete process.env.HUBTEL_SECRET_KEY
        delete process.env.HUBTEL_API_KEY
        stores.Organization.push({ id: 'organization-1', receiptCode: 'KONDO', deletedAt: null })
    })

    afterAll(() => {
        process.env.PAYSTACK_SECRET_KEY = originalPaystackSecret
        process.env.HUBTEL_SECRET_KEY = originalHubtelSecret
        process.env.HUBTEL_API_KEY = originalHubtelApiKey
    })

    test('returns the safe Paystack initiation response shape', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'

        const result = await initiateRentPaymentPublic({}, {
            ...baseInitiationData,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            paymentContext: { id: 'payment-context-1' },
            reference: 'paystack-init-ref-1',
        })

        expectOnlyPublicFields(result)
        expect(result).toEqual({
            paymentId: 'Payment-1',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-init-ref-1',
            amount: '125.50',
            currency: 'GHS',
            status: PAYMENT_PROCESSING_STATUS,
            authorizationUrl: null,
            paymentUrl: null,
            actionTaken: null,
        })
        expect(result.providerInitResponse).toBeUndefined()
    })

    test('returns the safe Hubtel initiation response shape', async () => {
        process.env.HUBTEL_SECRET_KEY = 'hubtel_test_secret'

        const result = await initiateRentPaymentPublic({}, {
            ...baseInitiationData,
            occupancy: { id: 'occupancy-1' },
            tenant: null,
            providerCode: RENT_PAYMENT_PROVIDER_HUBTEL,
            paymentContext: { id: 'payment-context-2' },
            reference: 'hubtel-init-ref-1',
        })

        expectOnlyPublicFields(result)
        expect(result).toEqual({
            paymentId: 'Payment-1',
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            providerReference: 'hubtel-init-ref-1',
            amount: '125.50',
            currency: 'GHS',
            status: PAYMENT_PROCESSING_STATUS,
            authorizationUrl: null,
            paymentUrl: null,
            actionTaken: null,
        })
    })

    test('rejects manual provider initiation through the public wrapper', async () => {
        await expect(initiateRentPaymentPublic({}, {
            ...baseInitiationData,
            providerCode: RENT_PAYMENT_PROVIDER_MANUAL,
        })).rejects.toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'RENT_PAYMENT_INITIATION_PROVIDER_NOT_ONLINE',
            provider: RENT_PAYMENT_PROVIDER_MANUAL,
        })
    })

    test('rejects unknown provider initiation through the public wrapper', async () => {
        await expect(initiateRentPaymentPublic({}, {
            ...baseInitiationData,
            providerCode: 'unknown-provider',
        })).rejects.toBeInstanceOf(UnknownPaymentProviderError)
    })

    test('returns the safe verification response shape', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'
        addRentCharge({ amount: '150' })
        addPendingPayment()
        const fetch = jest.fn().mockResolvedValue(createJsonResponse({
            status: true,
            data: {
                status: 'success',
                amount: '15000',
                currency: 'GHS',
                paid_at: '2026-05-05T00:00:00.000Z',
                reference: 'paystack-ref-1',
            },
        }))

        const result = await verifyPendingPaymentPublic({}, {
            dv: 1,
            sender,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
        }, { fetch })

        expectOnlyPublicFields(result)
        expect(result).toEqual({
            paymentId: 'payment-1',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
            amount: '150',
            currency: 'GHS',
            status: PAYMENT_DONE_STATUS,
            authorizationUrl: null,
            paymentUrl: null,
            actionTaken: 'confirmed',
        })
        expect(result.verification).toBeUndefined()
        expect(result.confirmation).toBeUndefined()
    })

    test('returns the safe webhook ingress response shape', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'
        addRentCharge({ amount: '150' })
        addPendingPayment()

        const rawBody = JSON.stringify({
            event: 'charge.success',
            data: {
                status: 'success',
                reference: 'paystack-ref-1',
                domain: 'live',
            },
        })
        const signature = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(rawBody)
            .digest('hex')

        const result = await handleProviderWebhookRequestPublic({}, {
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            parsedPayload: JSON.parse(rawBody),
            rawBody,
            headers: {
                'X-Paystack-Signature': signature,
            },
            mode: 'production',
        })

        expectOnlyPublicFields(result)
        expect(result).toEqual({
            paymentId: 'payment-1',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-ref-1',
            amount: '150',
            currency: 'GHS',
            status: PAYMENT_DONE_STATUS,
            authorizationUrl: null,
            paymentUrl: null,
            actionTaken: 'confirmed',
        })
        expect(result.metadata).toBeUndefined()
        expect(result.webhook).toBeUndefined()
    })
})
