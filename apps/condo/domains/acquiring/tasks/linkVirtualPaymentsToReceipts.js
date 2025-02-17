const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx, itemsQuery } = require('@open-condo/keystone/schema')

const { FIND_PAYMENTS_CHUNK_SIZE } = require('@condo/domains/acquiring/constants/constants')
const { freezeBillingReceipt } = require('@condo/domains/acquiring/utils/billingFridge')
const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/billing/constants/constants')
const { getPreviousPeriods } = require('@condo/domains/billing/utils/period')


const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'link-virtual-payments-to-receipts-task' } }
const logger = getLogger('linkVirtualPaymentsToReceipts')

async function fetchEntities (entity, filter, key) {
    const records = await find(entity, filter)
    return new Map(records.map(record => [record[key], record]))
}

async function processPayments (payments, context, organizationMap, contextMap, accountMap) {
    for (const payment of payments) {
        const organization = organizationMap.get(payment.organization)
        const billingContext = contextMap.get(payment.organization)
        const billingAccount = accountMap.get(payment.accountNumber)

        if (!get(organization, 'tin') || !get(billingContext, 'id') || !get(billingAccount, 'id')) {
            logger.warn({ msg: 'Skipping payment due to missing fields', data: { paymentId: payment.id } })
            continue
        }

        const [receipt] = await find('BillingReceipt', {
            deletedAt: null,
            period: payment.period,
            context: { id: billingContext.id },
            account: { id: billingAccount.id },
            receiver: {
                bankAccount: payment.recipientBankAccount,
                bic: payment.recipientBic,
                tin: organization.tin,
            },
        })

        if (receipt) {
            await Payment.update(context, payment.id, {
                ...dvAndSender,
                receipt: { connect: { id: receipt.id } },
                frozenReceipt: await freezeBillingReceipt(context, receipt),
            })
            logger.info({ msg: 'Payment linked to receipt', data: { paymentId: payment.id, receiptId: receipt.id } })
        }
    }
}

async function linkVirtualPaymentsToReceipts () {
    logger.info({ msg: 'Starting linkVirtualPaymentsToReceipts task' })
    const { keystone: context } = getSchemaCtx('Payment')
    let lastProcessedDate = null
    let hasMoreData = true

    while (hasMoreData) {
        const payments = await itemsQuery('Payment', {
            where: {
                deletedAt: null,
                receipt: { id: null },
                frozenReceipt: null,
                invoice: { id: null },
                frozenInvoice: null,
                period_in: getPreviousPeriods(new Date().toISOString(), 2),
                ...(lastProcessedDate ? { createdAt_gt: dayjs(lastProcessedDate).toISOString() } : {}),
            },
            first: FIND_PAYMENTS_CHUNK_SIZE,
            orderBy: 'createdAt_ASC',
        })

        if (!payments.length) {
            logger.info({ msg: 'No payments found that need linking' })
            break
        }

        hasMoreData = payments.length >= FIND_PAYMENTS_CHUNK_SIZE
        lastProcessedDate = payments[payments.length - 1].createdAt

        const organizationMap = await fetchEntities('Organization', {
            id_in: payments.map(({ organization }) => organization),
            deletedAt: null,
        }, 'id')

        const contextMap = await fetchEntities('BillingIntegrationOrganizationContext', {
            organization: { id_in: payments.map(({ organization }) => organization) },
            status: CONTEXT_FINISHED_STATUS,
            deletedAt: null,
        }, 'organization')

        const accountMap = await fetchEntities('BillingAccount', {
            number_in: payments.map(({ accountNumber }) => accountNumber),
            deletedAt: null,
        }, 'number')

        await processPayments(payments, context, organizationMap, contextMap, accountMap)
    }

    logger.info({ msg: 'linkVirtualPaymentsToReceipts task completed' })
}

module.exports = { linkVirtualPaymentsToReceipts }
