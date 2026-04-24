const Big = require('big.js')
const dayjs = require('dayjs')

const {
    PAYMENT_DONE_STATUS,
    MULTIPAYMENT_DONE_STATUS,
    DEFAULT_MULTIPAYMENT_SERVICE_CATEGORY,
} = require('@condo/domains/acquiring/constants/payment')

function buildPaymentCreateInput (input, acquiringContext, sender) {
    const depositedDate = input.depositedDate
        ? dayjs(input.depositedDate).toISOString()
        : dayjs(input.transactionDate).toISOString()

    return {
        dv: 1,
        sender,
        status: PAYMENT_DONE_STATUS,
        amount: Big(input.amount).toString(),
        explicitFee: Big(input.explicitFee || 0).toString(),
        implicitFee: Big(input.implicitFee || 0).toString(),
        currencyCode: input.currencyCode,
        accountNumber: input.accountNumber,
        period: input.period,
        recipientBic: input.routingNumber,
        recipientBankAccount: input.bankAccount,
        transferDate: dayjs(input.transactionDate).toISOString(),
        depositedDate,
        rawAddress: input.address,
        order: input.paymentOrder,
        organization: { connect: { id: acquiringContext.organization } },
        context: { connect: { id: acquiringContext.id } },
    }
}

function buildMultiPaymentCreateInput (input, payment, acquiringIntegration, sender) {
    return {
        dv: 1,
        sender,
        status: MULTIPAYMENT_DONE_STATUS,
        amountWithoutExplicitFee: Big(input.amount).toString(),
        explicitFee: Big(input.explicitFee || 0).toString(),
        implicitFee: Big(input.implicitFee || 0).toString(),
        explicitServiceCharge: Big(0).toString(),
        currencyCode: input.currencyCode,
        integration: { connect: { id: acquiringIntegration.id } },
        payments: { connect: [{ id: payment.id }] },
        serviceCategory: DEFAULT_MULTIPAYMENT_SERVICE_CATEGORY,
        transactionId: input.transactionId,
        withdrawnAt: dayjs(input.transactionDate).toISOString(),
    }
}

module.exports = {
    buildPaymentCreateInput,
    buildMultiPaymentCreateInput,
}