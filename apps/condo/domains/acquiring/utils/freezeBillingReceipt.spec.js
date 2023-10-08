/**
 * @jest-environment node
 */

const { getById } = require('@open-condo/keystone/schema')
const { prepareKeystoneExpressApp, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { makePayer } = require('@condo/domains/acquiring/utils/testSchema')

const { freezeBillingReceipt } = require('./freezeBillingReceipt')


describe('freezeBillingReceipt', () => {
    setFakeClientMode(require.resolve('../../../index'))
    let frozenReceipt
    beforeAll(async () => {
        await prepareKeystoneExpressApp(require.resolve('../../../index'))
        const { billingReceipts } = await makePayer()
        const flatReceipt = await getById('BillingReceipt', billingReceipts[0].id)
        frozenReceipt = await freezeBillingReceipt(flatReceipt)
    })
    test('should contains correct dv (=== 1)', () => {
        expect(frozenReceipt).toHaveProperty('dv', 1)
    })
    test('should contains accountNumber', () => {
        expect(frozenReceipt).toHaveProperty(['data', 'account', 'number'])
    })
    test('should provide information about receipt', () => {
        expect(frozenReceipt).toHaveProperty('data')
        const { data } = frozenReceipt

        expect(data).toBeDefined()
        expect(data).toHaveProperty('id')
        expect(data).toHaveProperty('period')
        expect(data).toHaveProperty('toPay')
        expect(data).toHaveProperty('toPayDetails')
        expect(data).toHaveProperty('services')
        expect(data).toHaveProperty('recipient')

        expect(data).toHaveProperty('receiver')
        const { receiver } = data
        expect(receiver).toHaveProperty('id')
        expect(receiver).toHaveProperty('tin')
        expect(receiver).toHaveProperty('iec')
        expect(receiver).toHaveProperty('bankAccount')

        expect(data).toHaveProperty('property')
        const { property } = data
        expect(property).toHaveProperty('id')
        expect(property).toHaveProperty('address')
        
        expect(data).toHaveProperty('account')
        const { account } = data
        expect(account).toHaveProperty('id')
        expect(account).toHaveProperty('number')
        expect(account).toHaveProperty('unitName')
        
        expect(data).toHaveProperty('organization')
        const { organization } = data
        expect(organization).toHaveProperty('id')
        expect(organization).toHaveProperty('name')

        expect(data).toHaveProperty('billingIntegration')
        const { billingIntegration } = data
        expect(billingIntegration).toHaveProperty('id')
        expect(billingIntegration).toHaveProperty('name')
    })
})