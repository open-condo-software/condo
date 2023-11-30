/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { createTestAcquiringIntegration } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBillingIntegration } = require('@condo/domains/billing/utils/testSchema')
const {
    INVOICE_CONTEXT_STATUS_FINISHED,
    DAYS_TO_CANCEL_PUBLISHED_INVOICES, INVOICE_STATUS_CANCELED, INVOICE_STATUS_PUBLISHED,
} = require('@condo/domains/marketplace/constants')
const { cancelOldInvoices } = require('@condo/domains/marketplace/tasks/cancelOldInvoices')
const {
    createTestInvoiceContext,
    createTestInvoice,
    updateTestInvoice, Invoice,
} = require('@condo/domains/marketplace/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')

let adminClient
let dummyO10n, dummyIntegration, dummyInvoiceContext

describe('cancelOldInvoices', () => {
    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()

        ;[dummyO10n] = await createTestOrganization(adminClient)
        await createTestBillingIntegration(adminClient)
        ;[dummyIntegration] = await createTestAcquiringIntegration(adminClient)
        ;[dummyInvoiceContext] = await createTestInvoiceContext(adminClient, dummyO10n, dummyIntegration, { status: INVOICE_CONTEXT_STATUS_FINISHED })
    })

    test('invoice must be canceled after period expired', async () => {
        const [invoice] = await createTestInvoice(adminClient, dummyInvoiceContext, { status: INVOICE_STATUS_PUBLISHED })
        await updateTestInvoice(adminClient, invoice.id, { publishedAt: dayjs().subtract(DAYS_TO_CANCEL_PUBLISHED_INVOICES + 3, 'day').toISOString() })
        await cancelOldInvoices()
        const canceledInvoice = await Invoice.getOne(adminClient, { id: invoice.id })

        expect(canceledInvoice.status).toBe(INVOICE_STATUS_CANCELED)
    })
})
