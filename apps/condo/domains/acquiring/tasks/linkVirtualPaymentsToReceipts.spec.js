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
    return { ...originalConstants, FIND_PAYMENTS_CHUNK_SIZE: 1 }
})

const generateVirtualReceipt = (billingAccount, year, month) => {
    const recipient = {
        routingNumber: '044525256',
        bankAccount: '40702810996180000019',
        accountNumber: billingAccount.number,
    }
    const receipt = {
        recipient,
        currencyCode: 'RUB',
        amount: '100.45',
        period: dayjs(`${year}-${month}-01`).format('YYYY-MM-01'),
    }
    return [recipient, receipt]
}

const setupTestBillingData = async (utils) => {
    const [billingProperty] = await createTestBillingProperty(utils.clients.admin, utils.billingContext, { address: utils.property.address })
    const [billingAccount] = await createTestBillingAccount(utils.clients.admin, utils.billingContext, billingProperty)
    return billingAccount
}

describe('linkReceiptsToPayment', () => {
    setFakeClientMode(index)

    test('Should correctly use pagination across 5 pages', async () => {
        const utils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await utils.init()
        const date = dayjs()

        const accounts = await Promise.all(
            Array.from({ length: 5 }).map(() => setupTestBillingData(utils))
        )

        const receipts = []
        const multipayments = []

        for (const billingAccount of accounts) {
            const [recipient, receipt] = generateVirtualReceipt(billingAccount, date.year(), date.month() + 1)
            receipts.push(utils.createJSONReceipt({
                accountNumber: billingAccount.number,
                ...recipient,
                tin: utils.organization.tin,
                month: date.month() + 1,
                year: date.year(),
            }))

            multipayments.push(registerMultiPaymentForVirtualReceiptByTestClient(
                utils.clients.admin,
                receipt,
                { id: utils.acquiringContext.id }
            ))
        }

        const [createdReceipts] = await utils.createReceipts(receipts)
        const registeredMultipayments = await Promise.all(multipayments)

        await linkVirtualPaymentsToReceipts()

        for (let i = 0; i < accounts.length; i++) {
            const [payment] = await find('Payment', {
                multiPayment: { id: registeredMultipayments[i][0].multiPaymentId },
            })

            expect(payment.receipt).toEqual(createdReceipts[i].id)
        }
    })

    test('Should link receipt to payment', async () => {
        const utils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await utils.init()
        const date = dayjs()

        const billingAccount = await setupTestBillingData(utils)
        const [recipient, receipt] = generateVirtualReceipt(billingAccount, date.year(), date.month() + 1)
        const [multipayment] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, receipt, { id: utils.acquiringContext.id })

        const [[createdReceipt]] = await utils.createReceipts([
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...recipient, tin: utils.organization.tin, month: date.month() + 1, year: date.year() }),
        ])

        await linkVirtualPaymentsToReceipts()
        const [payment] = await find('Payment', { multiPayment: { id: multipayment.multiPaymentId } })

        expect(payment.receipt).toBe(createdReceipt.id)
    })

    test('Should link receipt to payment for last 2 periods', async () => {
        const utils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await utils.init()
        const date1 = dayjs()
        const date2 = date1.subtract(1, 'month')
        const date3 = date1.subtract(2, 'month')
        const billingAccount = await setupTestBillingData(utils)
        const [recipient1, virtualReceipt1] = generateVirtualReceipt(billingAccount, date1.year(), date1.month() + 1)
        const [recipient2, virtualReceipt2] = generateVirtualReceipt(billingAccount, date2.year(), date2.month() + 1)
        const [recipient3, virtualReceipt3] = generateVirtualReceipt(billingAccount, date3.year(), date3.month() + 1)

        const [multipayment1] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, virtualReceipt1, { id: utils.acquiringContext.id })
        const [multipayment2] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, virtualReceipt2, { id: utils.acquiringContext.id })
        const [multipayment3] = await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, virtualReceipt3, { id: utils.acquiringContext.id })

        const [createdReceipts] = await utils.createReceipts([
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...recipient1, tin: utils.organization.tin, month: date1.month() + 1, year: date1.year() }),
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...recipient2, tin: utils.organization.tin, month: date2.month() + 1, year: date2.year() }),
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...recipient3, tin: utils.organization.tin, month: date3.month() + 1, year: date3.year() }),
        ])

        await linkVirtualPaymentsToReceipts()
        const [payment1] = await find('Payment', { multiPayment: { id: multipayment1.multiPaymentId } })
        const [payment2] = await find('Payment', { multiPayment: { id: multipayment2.multiPaymentId } })
        const [payment3] = await find('Payment', { multiPayment: { id: multipayment3.multiPaymentId } })

        const receipt1 = createdReceipts.find(receipt => receipt.id === payment1.receipt)
        const receipt2 = createdReceipts.find(receipt => receipt.id === payment2.receipt)

        expect(payment1.receipt).toBe(receipt1.id)
        expect(payment2.receipt).toBe(receipt2.id)
        expect(payment3.receipt).toBe(null)
    })
})
