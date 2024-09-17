const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')

const { PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS } = require('../../acquiring/constants/payment')

function getUnconnectedPayments (organizationId) {
    return find('Payment', {
        organization: { id: organizationId },
        invoice_is_null: true,
        receipt_is_null: true,
        deletedAt: null,
        status_in: [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS],
    })
}

async function getReceiptByBankInfo ({ organization, recipientBankAccount, recipientBic, period, accountNumber }) {
    const [receipt] = await find('BillingReceipt', {
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
    return receipt
}

async function connectPaymentsToBillingReceiptsForOrganization (dv, sender, organizationIds) {
    const { keystone: context } = getSchemaCtx('Payment')

    for (const organizationId of organizationIds) {
        const payments = await getUnconnectedPayments(organizationId)
        for (const payment of payments) {
            const receipt = await getReceiptByBankInfo(payment)
            if (!receipt) continue
            await Payment.update(context, payment.id, { dv, sender, receipt: { connect: { id: receipt.id } } })
        }
    }
}

module.exports = {
    connectPaymentsToBillingReceiptsForOrganizations: connectPaymentsToBillingReceiptsForOrganization,
}