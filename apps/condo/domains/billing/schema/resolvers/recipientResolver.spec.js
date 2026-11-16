const { getOrganizationInfo, getBankInfo } = require('@open-condo/clients/finance-info-client')
const { find } = require('@open-condo/keystone/schema')

const { BillingRecipient } = require('@condo/domains/billing/utils/serverSchema')

const { RecipientResolver } = require('./recipientResolver')

jest.mock('@open-condo/clients/finance-info-client', () => ({
    getBankInfo: jest.fn(),
    getOrganizationInfo: jest.fn(),
}))
jest.mock('@open-condo/keystone/schema', () => ({
    find: jest.fn(),
}))
jest.mock('@condo/domains/billing/utils/serverSchema', () => ({
    BillingRecipient: {
        create: jest.fn(),
        update: jest.fn(),
    },
}))

const createReceipt = (overrides = {}) => ({
    bankAccount: '40702810000000000001',
    routingNumber: '044525225',
    tin: '7707083893',
    problems: [],
    ...overrides,
})

describe('RecipientResolver', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        find.mockResolvedValue([])
        getBankInfo.mockResolvedValue({ result: { bankName: 'Bank', offsettingAccount: '30101810400000000225' } })
        getOrganizationInfo.mockResolvedValue({ result: { name: 'Organization', iec: '773601001' } })
        BillingRecipient.create.mockResolvedValue({ id: 'recipient-id', isApproved: true })
    })

    test('loads finance data and saves recipient once for the same bank account', async () => {
        const resolver = new RecipientResolver({ billingContext: { id: 'context-id' }, context: {} })
        await resolver.init()

        const { receipts } = await resolver.processReceipts({
            0: createReceipt(),
            1: createReceipt({ tin: '7811089030', routingNumber: '044030653' }),
        })

        expect(getBankInfo).toHaveBeenCalledTimes(1)
        expect(getOrganizationInfo).toHaveBeenCalledTimes(1)
        expect(BillingRecipient.create).toHaveBeenCalledTimes(1)
        expect(receipts[0].receiver).toEqual('recipient-id')
        expect(receipts[1].receiver).toEqual('recipient-id')
    })

    test('keeps a bad routing number as an error of one receipt', async () => {
        getBankInfo
            .mockResolvedValueOnce({ result: { bankName: 'Bank' } })
            .mockResolvedValueOnce({ error: new Error('Invalid routing number: bad-bic') })

        const resolver = new RecipientResolver({ billingContext: { id: 'context-id' }, context: {} })
        await resolver.init()
        const { receipts, errorReceipts } = await resolver.processReceipts({
            0: createReceipt(),
            1: createReceipt({ bankAccount: '40702810000000000002', routingNumber: 'bad-bic' }),
        })

        expect(BillingRecipient.create).toHaveBeenCalledTimes(1)
        expect(receipts[0].receiver).toEqual('recipient-id')
        expect(errorReceipts[1].message).toContain('bad-bic')
    })

    test('does not save recipients when finance service is unavailable', async () => {
        getBankInfo
            .mockResolvedValueOnce({ result: { bankName: 'Bank' } })
            .mockResolvedValueOnce({ error: new Error('Failed to fetch: /findById/bank') })

        const resolver = new RecipientResolver({ billingContext: { id: 'context-id' }, context: {} })
        await resolver.init()

        await expect(resolver.processReceipts({
            0: createReceipt(),
            1: createReceipt({ bankAccount: '40702810000000000002', routingNumber: '044030653' }),
        })).rejects.toThrow('Failed to fetch')
        expect(BillingRecipient.create).not.toHaveBeenCalled()
    })

    test('treats a finance cache error as infrastructure failure', async () => {
        getOrganizationInfo.mockResolvedValue({ error: new Error('Connection is closed') })
        const resolver = new RecipientResolver({ billingContext: { id: 'context-id' }, context: {} })
        await resolver.init()

        await expect(resolver.processReceipts({ 0: createReceipt() })).rejects.toThrow('Connection is closed')
        expect(BillingRecipient.create).not.toHaveBeenCalled()
    })

    test('includes bank account in recipient persistence error', async () => {
        BillingRecipient.create.mockRejectedValue(new Error('database error'))
        const resolver = new RecipientResolver({ billingContext: { id: 'context-id' }, context: {} })
        await resolver.init()
        const { errorReceipts } = await resolver.processReceipts({ 0: createReceipt() })

        expect(errorReceipts[0].message).toContain('40702810000000000001')
    })
})
