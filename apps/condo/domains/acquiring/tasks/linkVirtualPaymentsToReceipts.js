const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'link-virtual-payments-to-receipts-task' } }
const logger = getLogger('linkVirtualPaymentsToReceipts')

async function linkVirtualPaymentsToReceipts () {
    logger.info({ msg: 'Starting linkVirtualPaymentsToReceipts task' })

    try {
        const { keystone } = getSchemaCtx('Payment')
        const context = await keystone.createContext({ skipAccessControl: true })

        const payments = await find('Payment', {
            deletedAt: null,
            receipt: { id: null },
            frozenReceipt: null,
            invoice: { id: null },
            frozenInvoice: null,
        })

        if (payments.length === 0) {
            logger.info({ msg: 'No payments found that need linking' })
            return
        }

        const [billingContexts, billingAccounts] = await Promise.all([
            find('BillingIntegrationOrganizationContext', {
                organization: { id_in: payments.map(({ organization }) => organization) },
                deletedAt: null,
            }),
            find('BillingAccount', {
                number_in: payments.map(({ accountNumber }) => accountNumber),
                deletedAt: null,
            }),
        ])

        const contextMap = new Map(billingContexts.map(ctx => [ctx.organization, ctx]))
        const accountMap = new Map(billingAccounts.map(acc => [acc.number, acc]))

        let linkedCount = 0
        let skippedCount = 0

        await Promise.all(payments.map(async (payment) => {
            const billingContext = contextMap.get(payment.organization)
            const billingAccount = accountMap.get(payment.accountNumber)

            if (!get(billingContext, 'id', null) || !get(billingAccount, 'id', null)) {
                logger.warn({
                    msg: 'Skipping payment due to missing billing context or account',
                    data: { paymentId: payment.id },
                })
                skippedCount++
                return
            }

            const receipts = await find('BillingReceipt', {
                deletedAt: null,
                period: payment.period,
                context: { id: billingContext.id },
                account: { id: billingAccount.id },
                recipient: {
                    bankAccount: payment.recipientBankAccount,
                    bic: payment.recipientBic,
                },
            })

            if (receipts.length > 1) {
                logger.warn({
                    msg: 'Skipping payment due to multiple matching receipts',
                    data: { paymentId: payment.id, receiptsCount: receipts.length },
                })
                skippedCount++
                return
            }

            const receipt = receipts[0]

            if (receipt) {
                await Payment.update(context, payment.id, {
                    ...dvAndSender,
                    receipt: { connect: { id: receipt.id } },
                    frozenReceipt: receipt,
                })
                logger.info({
                    msg: 'Payment linked to receipt',
                    data: { paymentId: payment.id, receiptId: receipt.id },
                })
                linkedCount++
            }
        }))

        logger.info({
            msg: 'Task completed',
            data: { linkedPayments: linkedCount, skippedPayments: skippedCount },
        })
    } catch (error) {
        logger.error({
            msg: 'Error in linkVirtualPaymentsToReceipts',
            error,
        })
    }
}

module.exports = { linkVirtualPaymentsToReceipts }
