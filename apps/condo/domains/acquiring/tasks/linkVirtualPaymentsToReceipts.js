const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx, itemsQuery } = require('@open-condo/keystone/schema')

const { FIND_PAYMENTS_CHUNK_SIZE } = require('@condo/domains/acquiring/constants/constants')
const { freezeBillingReceipt } = require('@condo/domains/acquiring/utils/billingFridge')
const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')
const { getPreviousPeriods } = require('@condo/domains/billing/utils/period')


const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'link-virtual-payments-to-receipts-task' } }
const logger = getLogger('linkVirtualPaymentsToReceipts')
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

        // console.log('FIND', payments, lastProcessedDate, FIND_PAYMENTS_CHUNK_SIZE)

        if (!payments.length && !lastProcessedDate) {
            logger.info({ msg: 'No payments found that need linking' })
            break
        }

        if (payments.length < FIND_PAYMENTS_CHUNK_SIZE) {
            hasMoreData = false
        }

        const organizations = await find('Organization', {
            id_in: payments.map(({ organization }) => organization),
            deletedAt: null,
        })

        const billingContexts = await find('BillingIntegrationOrganizationContext', {
            organization: { id_in: payments.map(({ organization }) => organization) },
            deletedAt: null,
        })

        const billingAccounts = await find('BillingAccount', {
            number_in: payments.map(({ accountNumber }) => accountNumber),
            deletedAt: null,
        })

        const organizationMap = new Map(organizations.map(acc => [acc.id, acc]))
        const contextMap = new Map(billingContexts.map(acc => [acc.organization, acc]))
        const accountMap = new Map(billingAccounts.map(acc => [acc.number, acc]))

        await Promise.all(payments.map(async (payment) => {
            const organization = organizationMap.get(payment.organization)
            const billingContext = contextMap.get(payment.organization)
            const billingAccount = accountMap.get(payment.accountNumber)

            if (!get(billingContext, 'id', null) || !get(billingAccount, 'id', null)) {
                logger.warn({
                    msg: 'Skipping payment due to missing billing account',
                    data: { paymentId: payment.id },
                })
                return
            }

            const [receipt] = await find('BillingReceipt', {
                deletedAt: null,
                period: payment.period,
                context: { id: billingContext.id },
                account: { id: billingAccount.id },
                // add json filter
                // recipient: {
                //     bankAccount: payment.recipientBankAccount,
                //     bic: payment.recipientBic,
                //     tin: organization.tin,
                // },
            })

            if (receipt) {
                await Payment.update(context, payment.id, {
                    ...dvAndSender,
                    receipt: { connect: { id: receipt.id } },
                    frozenReceipt: await freezeBillingReceipt(context, receipt),
                })
                logger.info({
                    msg: 'Payment linked to receipt',
                    data: { paymentId: payment.id, receiptId: receipt.id },
                })
                lastProcessedDate = payment.createdAt // Обновляем дату последней обработанной записи
            }
        }))
    }

    logger.info({ msg: 'linkVirtualPaymentsToReceipts task completed' })
}


module.exports = { linkVirtualPaymentsToReceipts }
