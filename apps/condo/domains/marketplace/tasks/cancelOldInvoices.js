const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    INVOICE_STATUS_PUBLISHED,
    DAYS_TO_CANCEL_PUBLISHED_INVOICES,
    INVOICE_STATUS_CANCELED,
} = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'cancelOldInvoicesCronTask' } }

const logger = getLogger()

async function cancelOldInvoices () {
    const someTimeAgo = dayjs().subtract(DAYS_TO_CANCEL_PUBLISHED_INVOICES, 'day').toISOString()
    /** @type {Invoice[]} */
    const invoices = await find(
        'Invoice',
        {
            status: INVOICE_STATUS_PUBLISHED,
            deletedAt: null,
            publishedAt_lte: someTimeAgo,
        },
    )

    const { keystone: context } = getSchemaCtx('Invoice')

    for (const invoice of invoices) {
        logger.info({ msg: 'cancel old invoice', data: invoice })
        await Invoice.update(context, invoice.id, { status: INVOICE_STATUS_CANCELED, ...DV_SENDER })
    }
}

module.exports = {
    cancelOldInvoicesCronTask: createCronTask('cancelOldInvoices', '11 */6 * * *', cancelOldInvoices),
    cancelOldInvoices,
}
