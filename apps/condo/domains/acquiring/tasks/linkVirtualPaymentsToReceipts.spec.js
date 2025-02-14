/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { linkVirtualPaymentsToReceipts } = require('./linkVirtualPaymentsToReceipts')

const { createTestBillingAccount, createTestBillingProperty } = require('../../billing/utils/testSchema')
const { AcquiringTestMixin, BillingTestMixin, TestUtils } = require('../../billing/utils/testSchema/testUtils')
const { registerMultiPaymentForVirtualReceiptByTestClient } = require('../utils/testSchema')

jest.mock('@condo/domains/acquiring/constants/constants', () => {
    const originalConstants = jest.requireActual('@condo/domains/acquiring/constants/constants')

    return {
        ...originalConstants,
        FIND_PAYMENTS_CHUNK_SIZE: 1,
    }
})

function generateVirtualReceipt (billingAccount){
    const recipient =  {
        routingNumber: '044525256',
        bankAccount: '40702810996180000019',
        accountNumber: billingAccount.number,
    }

    const receipt = {
        currencyCode: 'RUB',
        amount: '100.45',
        period: dayjs().format('YYYY-MM-01'),
        recipient,
    }
    
    return [recipient, receipt]
}

describe('linkReceiptsToPayment', () => {
    setFakeClientMode(index)
    
    test('Should correctly use pagination', async () => {
        const utils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await utils.init()
        const anotherUtils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await anotherUtils.init()
        
        const [billingProperty] = await createTestBillingProperty(utils.clients.admin, utils.billingContext, {
            address: utils.property.address,
        })
        const [billingAccount] = await createTestBillingAccount(utils.clients.admin, utils.billingContext, billingProperty)

        const [anotherBillingProperty] = await createTestBillingProperty(anotherUtils.clients.admin, anotherUtils.billingContext, {
            address: anotherUtils.property.address,
        })
        const [anotherBillingAccount] = await createTestBillingAccount(anotherUtils.clients.admin, anotherUtils.billingContext, anotherBillingProperty)
        
        const [recipient, receipt] = generateVirtualReceipt(billingAccount)
        const [anotherRecipient, anotherReceipt] = generateVirtualReceipt(anotherBillingAccount)

        const [multipayment] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, receipt, { id: utils.acquiringContext.id })
        const [anotherMultipayment] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, anotherReceipt, { id: anotherUtils.acquiringContext.id })

        const [[createdReceipt]] = await utils.createReceipts([
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...recipient, month: 2, year: 2025 }),
        ])

        const [[anotherCreatedReceipt]] = await anotherUtils.createReceipts([
            utils.createJSONReceipt({ accountNumber: anotherBillingAccount.number, ...anotherRecipient, month: 2, year: 2025 }),
        ])

        await linkVirtualPaymentsToReceipts()

        const [payment] = await find('Payment', {
            multiPayment: { id: multipayment.multiPaymentId },
        })

        const [anotherPayment] = await find('Payment', {
            multiPayment: { id: anotherMultipayment.multiPaymentId },
        })

        expect(payment.receipt).toEqual(createdReceipt.id)
        expect(anotherPayment.receipt).toEqual(anotherCreatedReceipt.id)
    })

    test('Should link receipt to payment', async () => {
        const utils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await utils.init()
        const [billingProperty] = await createTestBillingProperty(utils.clients.admin, utils.billingContext, {
            address: utils.property.address,
        })
        const [billingAccount] = await createTestBillingAccount(utils.clients.admin, utils.billingContext, billingProperty)

        const [recipient, receipt] = generateVirtualReceipt(billingAccount)

        const [multipayment] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, receipt, { id: utils.acquiringContext.id })

        const [[createdReceipt]] = await utils.createReceipts([
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...{ ...recipient, tin: utils.organization.tin }, month: 2, year: 2025 }),
        ])
        await linkVirtualPaymentsToReceipts()

        const [payment] = await find('Payment', {
            multiPayment: { id: multipayment.multiPaymentId },
        })

        expect(payment.receipt).toBe(createdReceipt.id)
    })
})
