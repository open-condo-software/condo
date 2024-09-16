const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')

const { PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS } = require('../../acquiring/constants/payment')

const logger = getLogger()

function getUnconnectedPayments (organizationId) {
    return find('Payment', {
        organization: { id: organizationId },
        invoice_is_null: true,
        receipt_is_null: true,
        deletedAt: null,
        status_in: [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS],
    })
}

function getReceiptsByBankInfo ({ organization, recipientBankAccount, recipientBic, period, accountNumber }) {
    return find('BillingReceipt', {
        context: {
            organization: { id: organization },
        },
        period: period,
        receiver: {
            bankAccount: recipientBankAccount,
            bic: recipientBic,
        },
        account: {
            number: accountNumber,
        },
        deletedAt: null,
    })
}

async function connectPaymentsToBillingReceiptsForOrganization (dv, sender, organizationIds) {
    const { keystone: context } = getSchemaCtx('Payment')

    for (const organizationId of organizationIds) {
        const payments = await getUnconnectedPayments(organizationId)
        for (const payment of payments) {
            const receipts = await getReceiptsByBankInfo(payment)
            if (receipts.length > 1) {
                logger.warn({ msg: `Multiple receipts for payment ${payment.id}` })
                continue
            }
            if (receipts.length === 0) {
                continue
            }
            await Payment.update(context, payment.id, { dv, sender, receipt: { connect: { id: receipts[0].id } } })
        }
    }
}

module.exports = {
    connectPaymentsToBillingReceiptsForOrganizations: connectPaymentsToBillingReceiptsForOrganization,
}