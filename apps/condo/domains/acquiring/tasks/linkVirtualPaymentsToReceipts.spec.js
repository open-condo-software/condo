/**
 * @jest-environment node
 */
const index = require('@app/condo/index')

const { find } = require('@open-condo/keystone/schema')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { linkVirtualPaymentsToReceipts } = require('./linkVirtualPaymentsToReceipts')

const { createTestBillingAccount, createTestBillingProperty } = require('../../billing/utils/testSchema')
const { AcquiringTestMixin, BillingTestMixin, TestUtils } = require('../../billing/utils/testSchema/testUtils')
const { registerMultiPaymentForVirtualReceiptByTestClient } = require('../utils/testSchema')



describe('linkReceiptsToPayment', () => {
    setFakeClientMode(index)

    test('test', async () => {
        const utils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await utils.init()
        const [billingProperty] = await createTestBillingProperty(utils.clients.admin, utils.billingContext, {
            address: utils.property.address,
        })
        const [billingAccount] = await createTestBillingAccount(utils.clients.admin, utils.billingContext, billingProperty)

        const recipient =  {
            routingNumber: '044525256',
            bankAccount: '40702810996180000019',
            accountNumber: billingAccount.number,
        }

        const receipt = {
            currencyCode: 'RUB',
            amount: '100.45',
            period: '2022-09-01',
            recipient,
        }
        const [multipayment] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, receipt, { id: utils.acquiringContext.id })

        const [[createdReceipt]] = await utils.createReceipts([
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...recipient, month: 9, year: 2022 }),
        ])

        console.log(multipayment, createdReceipt)
        
        await linkVirtualPaymentsToReceipts()

        const [payment] = await find('Payment', {
            multiPayment: { id: multipayment.multiPaymentId },
        })

        expect(payment.receipt).toBe(createdReceipt.id)
        expect(payment.frozenReceipt).toMatchObject(createdReceipt)
    })
})
