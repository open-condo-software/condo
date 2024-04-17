/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { getById } = require('@open-condo/keystone/schema')
const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { makePayer } = require('@condo/domains/acquiring/utils/testSchema')
const {
    createTestBillingIntegration,
    updateTestBillingReceipt,
    createTestBillingRecipient,
} = require('@condo/domains/billing/utils/testSchema')
const { createTestInvoice } = require('@condo/domains/marketplace/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')

const { freezeBillingReceipt, freezeInvoice } = require('./billingFridge')
const { createTestAcquiringIntegration, createTestAcquiringIntegrationContext } = require('./testSchema')

const { createTestBillingReceipt } = require('../../billing/utils/testSchema')

const { keystone } = index

describe('billingFridge', () => {
    let context
    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
    })

    describe('freezeBillingReceipt', () => {
        let frozenReceipt

        beforeAll(async () => {
            const admin = await makeLoggedInAdminClient()
            const {
                billingContext,
                billingProperty,
                billingAccount,
            } = await makePayer()

            // create a real recipient
            const [billingRecipient] = await createTestBillingRecipient(admin, billingContext)

            const [receipt] = await createTestBillingReceipt(
                admin,
                billingContext,
                billingProperty,
                billingAccount,
                { period: dayjs().format('YYYY-MM-01'), receiver: { connect: { id: billingRecipient.id } } },
            )

            // get receipt and make frozen receipt
            const flatReceipt = await getById('BillingReceipt', receipt.id)
            frozenReceipt = await freezeBillingReceipt(context, flatReceipt)
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
            await createTestAcquiringIntegrationContext(adminClient, o10n, integration, { invoiceStatus: CONTEXT_FINISHED_STATUS })
            const [invoice] = await createTestInvoice(adminClient, o10n)
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
        })
    })
})
