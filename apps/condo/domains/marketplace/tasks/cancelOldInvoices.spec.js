/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { createTestAcquiringIntegration, createTestAcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBillingIntegration } = require('@condo/domains/billing/utils/testSchema')
const {
    DAYS_TO_CANCEL_PUBLISHED_INVOICES, INVOICE_STATUS_CANCELED, INVOICE_STATUS_PUBLISHED,
} = require('@condo/domains/marketplace/constants')
const { cancelOldInvoices } = require('@condo/domains/marketplace/tasks/cancelOldInvoices')
const {
    createTestInvoice,
    updateTestInvoice, Invoice,
} = require('@condo/domains/marketplace/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')

let adminClient
let dummyO10n, dummyIntegration

describe('cancelOldInvoices', () => {
    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()

        ;[dummyO10n] = await createTestOrganization(adminClient)
        await createTestBillingIntegration(adminClient)
        ;[dummyIntegration] = await createTestAcquiringIntegration(adminClient)
        await createTestAcquiringIntegrationContext(adminClient, dummyO10n, dummyIntegration, { invoiceStatus: CONTEXT_FINISHED_STATUS })
    })

    test('invoice must be canceled after period expired', async () => {
        const [invoice] = await createTestInvoice(adminClient, dummyO10n, { status: INVOICE_STATUS_PUBLISHED })
        await updateTestInvoice(adminClient, invoice.id, { publishedAt: dayjs().subtract(DAYS_TO_CANCEL_PUBLISHED_INVOICES + 3, 'day').toISOString() })
        await cancelOldInvoices()
        const canceledInvoice = await Invoice.getOne(adminClient, { id: invoice.id })

        expect(canceledInvoice.status).toBe(INVOICE_STATUS_CANCELED)
    })
})
