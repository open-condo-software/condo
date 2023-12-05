/**
 * @jest-environment node
 */

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { getById } = require('@open-condo/keystone/schema')
const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { makePayer } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBillingIntegration } = require('@condo/domains/billing/utils/testSchema')
const { INVOICE_CONTEXT_STATUS_FINISHED } = require('@condo/domains/marketplace/constants')
const { createTestInvoiceContext, createTestInvoice } = require('@condo/domains/marketplace/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')

const { freezeBillingReceipt, freezeInvoice } = require('./billingFridge')
const { createTestAcquiringIntegration } = require('./testSchema')

describe('billingFridge', () => {

    setFakeClientMode(require.resolve('../../../index'))

    beforeAll(async () => {
        await prepareKeystoneExpressApp(require.resolve('../../../index'))
    })

    describe('freezeBillingReceipt', () => {
        let frozenReceipt

        beforeAll(async () => {
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

    describe('freezeInvoice', () => {
        let frozenInvoice

        beforeAll(async () => {
            const adminClient = await makeLoggedInAdminClient()
            const [o10n] = await createTestOrganization(adminClient)
            await createTestBillingIntegration(adminClient)
            const [integration] = await createTestAcquiringIntegration(adminClient)
            const [invoiceContext] = await createTestInvoiceContext(adminClient, o10n, integration, { status: INVOICE_CONTEXT_STATUS_FINISHED })
            const [invoice] = await createTestInvoice(adminClient, invoiceContext)
            const flatInvoice = await getById('Invoice', invoice.id)
            frozenInvoice = await freezeInvoice(flatInvoice)
        })

        test('should contains correct dv (=== 1)', () => {
            expect(frozenInvoice).toHaveProperty('dv', 1)
        })

        test('should provide information about invoice', () => {
            expect(frozenInvoice).toHaveProperty('data')
            const { data } = frozenInvoice

            expect(data).toBeDefined()
            expect(data).toHaveProperty('id')
            expect(data).toHaveProperty('number')
            expect(data).toHaveProperty('toPay')
            expect(data).toHaveProperty('unitType')
            expect(data).toHaveProperty('unitName')
            expect(data).toHaveProperty('accountNumber')
            expect(data).toHaveProperty('status')
            expect(data).toHaveProperty('paymentType')
            expect(data).toHaveProperty('ticket')
            expect(data).toHaveProperty('contact')
            expect(data).toHaveProperty('client')

            expect(data).toHaveProperty('rows')
            const { rows:[row] } = data
            expect(row).toHaveProperty('name')
            expect(row).toHaveProperty('toPay')
            expect(row).toHaveProperty('count')
            expect(row).toHaveProperty('currencyCode')

            expect(data).toHaveProperty('context')
            const { context } = data
            expect(context).toHaveProperty('recipient')
            expect(context).toHaveProperty('implicitFeePercent')
            expect(context).toHaveProperty('vatPercent')
            expect(context).toHaveProperty('taxRegime')
            expect(context).toHaveProperty('id')
            expect(context).toHaveProperty('currencyCode')
            expect(context).toHaveProperty('salesTaxPercent')
            expect(context).toHaveProperty('integration')
        })
    })
})
