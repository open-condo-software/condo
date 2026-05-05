/**
 * @jest-environment node
 */

const paymentStore = []
const findCalls = []
const mockPaymentCreate = jest.fn(async (context, data) => {
    const payment = {
        id: `payment-${paymentStore.length + 1}`,
        ...flattenRelations(data),
        deletedAt: null,
    }

    paymentStore.push(payment)

    return payment
})

function flattenRelations (data) {
    const result = { ...data }

    for (const [key, value] of Object.entries(result)) {
        if (value && value.connect && value.connect.id) {
            result[key] = value.connect.id
        }
    }

    return result
}

function getRelationId (value) {
    return value && value.id ? value.id : value
}

function matchesWhere (item, where) {
    return Object.entries(where).every(([key, value]) => {
        if (key === 'deletedAt') return item.deletedAt === value
        if (value && typeof value === 'object' && value.id) return getRelationId(item[key]) === value.id
        return item[key] === value
    })
}

const mockFind = jest.fn(async (listKey, where) => {
    findCalls.push({ listKey, where })

    if (listKey !== 'Payment') return []

    return paymentStore.filter(item => matchesWhere(item, where))
})

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getById: jest.fn(),
}))

jest.mock('@open-condo/codegen/generate.server.utils', () => ({
    execGqlWithoutAccess: jest.fn(),
    generateServerUtils: jest.fn((listKey) => ({
        create: listKey === 'Payment' ? mockPaymentCreate : jest.fn(),
        update: jest.fn(),
        getOne: jest.fn(),
    })),
}))

jest.mock('@condo/domains/billing/utils/serverSchema', () => ({
    calculateLedgerBalance: jest.fn(),
    reverseConfirmedRentPayment: jest.fn(),
}))

const {
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RENT_PAYMENT_PROVIDER_HUBTEL,
    RENT_PAYMENT_PROVIDER_MANUAL,
    RENT_PAYMENT_PROVIDER_PAYSTACK,
} = require('@condo/domains/acquiring/constants/rentPayment')
const {
    initiateRentPayment,
    RentPaymentInitiationError,
} = require('./index')
const { UnknownPaymentProviderError } = require('./paymentProviders')

const BASE_CONTEXT = {}
const BASE_DATA = {
    dv: 1,
    sender: { dv: 1, fingerprint: 'test-device' },
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

describe('initiateRentPayment', () => {
    const originalPaystackSecret = process.env.PAYSTACK_SECRET_KEY
    const originalHubtelSecret = process.env.HUBTEL_SECRET_KEY
    const originalHubtelApiKey = process.env.HUBTEL_API_KEY

    beforeEach(() => {
        paymentStore.length = 0
        findCalls.length = 0
        jest.clearAllMocks()
        delete process.env.PAYSTACK_SECRET_KEY
        delete process.env.HUBTEL_SECRET_KEY
        delete process.env.HUBTEL_API_KEY
    })

    afterAll(() => {
        process.env.PAYSTACK_SECRET_KEY = originalPaystackSecret
        process.env.HUBTEL_SECRET_KEY = originalHubtelSecret
        process.env.HUBTEL_API_KEY = originalHubtelApiKey
    })

    test('creates a pending payment intent record for Paystack without allocations or ledger side effects', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'

        const result = await initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            paymentContext: { id: 'payment-context-1' },
            reference: 'paystack-init-ref-1',
        })

        expect(result.idempotent).toBe(false)
        expect(result.providerReference).toBe('paystack-init-ref-1')
        expect(result.initiation).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            status: PAYMENT_INIT_STATUS,
            providerStatus: 'initialized',
            externalTransactionId: 'paystack-init-ref-1',
            metadata: {
                stub: true,
            },
        })
        expect(result.payment).toEqual({
            id: 'payment-1',
            dv: 1,
            sender: { dv: 1, fingerprint: 'test-device' },
            amount: '125.50',
            currencyCode: 'GHS',
            organization: 'organization-1',
            tenant: 'tenant-1',
            paymentMethod: null,
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-init-ref-1',
            externalTransactionId: 'paystack-init-ref-1',
            purpose: 'Online rent payment initiation',
            recipientBic: 'PENDING',
            recipientBankAccount: 'PENDING',
            status: PAYMENT_PROCESSING_STATUS,
            providerInitResponse: expect.objectContaining({
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerStatus: 'initialized',
            }),
            deletedAt: null,
        })
        expect(paymentStore).toHaveLength(1)
        expect(findCalls.some(call => call.listKey === 'PaymentAllocation')).toBe(false)
        expect(findCalls.some(call => call.listKey === 'LedgerEntry')).toBe(false)
    })

    test('creates a pending payment intent record for Hubtel', async () => {
        process.env.HUBTEL_SECRET_KEY = 'hubtel_test_secret'

        const result = await initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            occupancy: { id: 'occupancy-1' },
            tenant: null,
            providerCode: RENT_PAYMENT_PROVIDER_HUBTEL,
            paymentContext: { id: 'payment-context-2' },
            reference: 'hubtel-init-ref-1',
        })

        expect(result.idempotent).toBe(false)
        expect(result.payment).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            providerReference: 'hubtel-init-ref-1',
            externalTransactionId: 'hubtel-init-ref-1',
            occupancy: 'occupancy-1',
            status: PAYMENT_PROCESSING_STATUS,
        })
        expect(result.initiation).toMatchObject({
            provider: RENT_PAYMENT_PROVIDER_HUBTEL,
            status: PAYMENT_INIT_STATUS,
            metadata: {
                stub: true,
            },
        })
        expect(findCalls.some(call => call.listKey === 'PaymentAllocation')).toBe(false)
        expect(findCalls.some(call => call.listKey === 'LedgerEntry')).toBe(false)
    })

    test('returns the existing pending intent idempotently for duplicate provider references', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'

        const firstResult = await initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            reference: 'paystack-init-ref-1',
        })
        const secondResult = await initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            reference: 'paystack-init-ref-1',
        })

        expect(firstResult.idempotent).toBe(false)
        expect(secondResult.idempotent).toBe(true)
        expect(secondResult.payment).toEqual(firstResult.payment)
        expect(mockPaymentCreate).toHaveBeenCalledTimes(1)
        expect(paymentStore).toHaveLength(1)
    })

    test('treats providerReference unique-constraint races as idempotent retries when payload matches', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'
        const duplicateConstraintError = new Error('duplicate key value violates unique constraint "payment_unique_provider_reference_per_scope"')

        mockPaymentCreate.mockImplementationOnce(async () => {
            paymentStore.push({
                id: 'payment-race-1',
                dv: 1,
                sender: { dv: 1, fingerprint: 'test-device' },
                amount: '125.50',
                currencyCode: 'GHS',
                organization: 'organization-1',
                tenant: 'tenant-1',
                paymentMethod: null,
                provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
                providerReference: 'paystack-init-ref-race',
                externalTransactionId: 'paystack-init-ref-race',
                purpose: 'Online rent payment initiation',
                recipientBic: 'PENDING',
                recipientBankAccount: 'PENDING',
                status: PAYMENT_PROCESSING_STATUS,
                deletedAt: null,
            })

            throw duplicateConstraintError
        })

        const result = await initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            reference: 'paystack-init-ref-race',
        })

        expect(result.idempotent).toBe(true)
        expect(result.payment.id).toBe('payment-race-1')
    })

    test('rejects conflicting duplicate provider references', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'

        await initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            reference: 'paystack-init-ref-1',
        })

        await expect(initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            amount: '126.00',
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
            reference: 'paystack-init-ref-1',
        })).rejects.toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'RENT_PAYMENT_INITIATION_DUPLICATE_PROVIDER_REFERENCE',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
            providerReference: 'paystack-init-ref-1',
            paymentId: 'payment-1',
        })
    })

    test('rejects unknown providers resolved outside the registry', async () => {
        await expect(initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: 'unknown-provider',
        })).rejects.toThrow(UnknownPaymentProviderError)

        expect(paymentStore).toHaveLength(0)
    })

    test('rejects manual providers for online initiation', async () => {
        await expect(initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_MANUAL,
        })).rejects.toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'RENT_PAYMENT_INITIATION_PROVIDER_NOT_ONLINE',
            provider: RENT_PAYMENT_PROVIDER_MANUAL,
        })

        expect(paymentStore).toHaveLength(0)
    })

    test('rejects unconfigured online providers', async () => {
        await expect(initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })).rejects.toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'RENT_PAYMENT_INITIATION_PROVIDER_NOT_CONFIGURED',
            provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })

        expect(paymentStore).toHaveLength(0)
    })

    test('requires tenant or occupancy context', async () => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack'

        await expect(initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            tenant: null,
            occupancy: null,
            providerCode: RENT_PAYMENT_PROVIDER_PAYSTACK,
        })).rejects.toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'RENT_PAYMENT_INITIATION_SUBJECT_REQUIRED',
        })

        expect(paymentStore).toHaveLength(0)
    })

    test('requires payer contact and rent or payment context', async () => {
        process.env.HUBTEL_SECRET_KEY = 'hubtel_test_secret'

        await expect(initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_HUBTEL,
            payerContact: null,
        })).rejects.toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'RENT_PAYMENT_INITIATION_PAYER_REQUIRED',
        })

        await expect(initiateRentPayment(BASE_CONTEXT, {
            ...BASE_DATA,
            providerCode: RENT_PAYMENT_PROVIDER_HUBTEL,
            rentContext: null,
            paymentContext: null,
        })).rejects.toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'RENT_PAYMENT_INITIATION_CONTEXT_REQUIRED',
        })

        expect(paymentStore).toHaveLength(0)
    })

    test('exports the typed initiation error for callers', () => {
        expect(new RentPaymentInitiationError('TEST_CODE', 'test message')).toMatchObject({
            name: 'RentPaymentInitiationError',
            code: 'TEST_CODE',
            message: 'test message',
        })
    })
})
