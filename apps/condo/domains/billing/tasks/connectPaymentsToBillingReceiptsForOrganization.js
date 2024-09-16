const dayjs = require('dayjs')

const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')

const { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('../../acquiring/constants/payment')

function getUnconnectedPayments (organizationId, bic, bankAccount, period) {
    return find('Payment', {
        organization: { id: organizationId },
        period: period,
        status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
        recipientBic: bic,
        recipientBankAccount: bankAccount,
        deletedAt: null,
        receipt_is_null: true,
    })
}

async function connectPaymentsToBillingReceiptsForOrganization (receiptInfos) {
    const { keystone: context } = getSchemaCtx('Payment')

    for (const receiptInfo of receiptInfos) {
        const { organization: { id }, month, year, routingNumber: bic, bankAccount, accountNumber } = receiptInfo
        const period = dayjs().year(year).month(month - 1).format('YYYY-MM-01')
        const unconnectedPayments = await getUnconnectedPayments(receiptInfo)
        const updateData = unconnectedPayments.map(payment => ({
            id: payment.id,
            data: {
                receipt: { connect: { id: receiptInfo.id } },
            },
        }))
        await Payment.updateMany(context, updateData)
    }
}

module.exports = {
    connectPaymentsToBillingReceiptsForOrganization,
}