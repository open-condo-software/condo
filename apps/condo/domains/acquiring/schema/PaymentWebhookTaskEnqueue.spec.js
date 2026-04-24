/**
 * @jest-environment node
 */

const mockDelay = jest.fn()
const mockGetById = jest.fn()

jest.mock('@condo/domains/acquiring/tasks', () => ({
    sendPaymentStatusChangeWebhook: {
        delay: mockDelay,
    },
}))

jest.mock('@open-condo/keystone/schema', () => {
    const actual = jest.requireActual('@open-condo/keystone/schema')

    return {
        ...actual,
        getById: mockGetById,
    }
})

const { faker } = require('@faker-js/faker')

const { getById } = require('@open-condo/keystone/schema')

const { sendPaymentStatusChangeWebhook } = require('@condo/domains/acquiring/tasks')

describe('Payment.afterChange (payment status change webhook task enqueue)', () => {
    const mockContext = {
        createContext: jest.fn(() => ({})),
        executeGraphQL: jest.fn(async () => ({ errors: undefined })),
    }

    const getAfterChangeHook = () => {
        let Payment
        jest.isolateModules(() => {
            ({ Payment } = require('./Payment'))
        })
        return Payment.schema.hooks.afterChange
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should enqueue webhook task when status changed and invoice has paymentStatusChangeWebhookUrl', async () => {
        const afterChangeHook = getAfterChangeHook()
        const paymentId = faker.datatype.uuid()
        const invoiceId = faker.datatype.uuid()

        getById.mockImplementation(async (listKey) => {
            if (listKey === 'Invoice') {
                return { paymentStatusChangeWebhookUrl: 'https://example.com/webhook' }
            }
            return null
        })

        await afterChangeHook({
            context: mockContext,
            operation: 'update',
            existingItem: { status: 'processing' },
            updatedItem: { id: paymentId, status: 'error', invoice: invoiceId },
        })

        expect(getById).toHaveBeenCalledWith('Invoice', invoiceId)
        expect(sendPaymentStatusChangeWebhook.delay).toHaveBeenCalledWith(paymentId)
    })

    test('should not enqueue webhook task when status changed but invoice/receipt has no paymentStatusChangeWebhookUrl', async () => {
        const afterChangeHook = getAfterChangeHook()
        const paymentId = faker.datatype.uuid()
        const invoiceId = faker.datatype.uuid()
        const receiptId = faker.datatype.uuid()

        getById.mockResolvedValue({})

        await afterChangeHook({
            context: mockContext,
            operation: 'update',
            existingItem: { status: 'processing' },
            updatedItem: { id: paymentId, status: 'error', invoice: invoiceId, receipt: receiptId },
        })

        expect(getById).toHaveBeenCalledWith('Invoice', invoiceId)
        expect(getById).toHaveBeenCalledWith('BillingReceipt', receiptId)
        expect(sendPaymentStatusChangeWebhook.delay).not.toHaveBeenCalled()
    })

    test('should enqueue webhook task when invoice has no URL but receipt has paymentStatusChangeWebhookUrl', async () => {
        const afterChangeHook = getAfterChangeHook()
        const paymentId = faker.datatype.uuid()
        const invoiceId = faker.datatype.uuid()
        const receiptId = faker.datatype.uuid()

        getById.mockImplementation(async (listKey) => {
            if (listKey === 'Invoice') return {}
            if (listKey === 'BillingReceipt') return { paymentStatusChangeWebhookUrl: 'https://example.com/webhook' }
            return null
        })

        await afterChangeHook({
            context: mockContext,
            operation: 'update',
            existingItem: { status: 'processing' },
            updatedItem: { id: paymentId, status: 'error', invoice: invoiceId, receipt: receiptId },
        })

        expect(getById).toHaveBeenCalledWith('Invoice', invoiceId)
        expect(getById).toHaveBeenCalledWith('BillingReceipt', receiptId)
        expect(sendPaymentStatusChangeWebhook.delay).toHaveBeenCalledWith(paymentId)
    })

    test('should enqueue webhook task when invoice/receipt lookup fails (fail-open)', async () => {
        const afterChangeHook = getAfterChangeHook()
        const paymentId = faker.datatype.uuid()
        const invoiceId = faker.datatype.uuid()

        getById.mockRejectedValue(new Error('DB error'))

        await afterChangeHook({
            context: mockContext,
            operation: 'update',
            existingItem: { status: 'processing' },
            updatedItem: { id: paymentId, status: 'error', invoice: invoiceId },
        })

        expect(getById).toHaveBeenCalledWith('Invoice', invoiceId)
        expect(sendPaymentStatusChangeWebhook.delay).toHaveBeenCalledWith(paymentId)
    })

    test('should not enqueue webhook task when status is not changed', async () => {
        const afterChangeHook = getAfterChangeHook()
        const paymentId = faker.datatype.uuid()
        const invoiceId = faker.datatype.uuid()

        await afterChangeHook({
            context: mockContext,
            operation: 'update',
            existingItem: { status: 'processing' },
            updatedItem: { id: paymentId, status: 'processing', invoice: invoiceId },
        })

        expect(sendPaymentStatusChangeWebhook.delay).not.toHaveBeenCalled()
    })
})
