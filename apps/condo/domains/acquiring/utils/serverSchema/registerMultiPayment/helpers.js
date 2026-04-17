const Big = require('big.js')

const { GQLError } = require('@open-condo/keystone/errors')

const { REQUEST_MODE } = require('@condo/domains/acquiring/constants/registerMultiPayment')
const { REGISTER_MULTI_PAYMENT_ERRORS: ERRORS } = require('@condo/domains/acquiring/constants/registerMultiPaymentErrors')

function calculateTotals (paymentCreateInputs) {
    return paymentCreateInputs.reduce((acc, cur) => {
        return {
            amountWithoutExplicitFee: acc.amountWithoutExplicitFee.plus(Big(cur.amount)),
            explicitFee: acc.explicitFee.plus(Big(cur.explicitFee)),
            explicitServiceCharge: acc.explicitServiceCharge.plus(Big(cur.explicitServiceCharge)),
            serviceFee: acc.serviceFee.plus(Big(cur.serviceFee)),
            implicitFee: acc.implicitFee.plus(Big(cur.implicitFee)),
        }
    }, {
        amountWithoutExplicitFee: Big('0.0'),
        explicitFee: Big('0.0'),
        explicitServiceCharge: Big('0.0'),
        serviceFee: Big('0.0'),
        implicitFee: Big('0.0'),
    })
}

function buildCommissionFields ({ type, explicitFee = '0', implicitFee = '0', fromReceiptAmountFee = '0' }) {
    return {
        ...type === 'service' ? {
            explicitServiceCharge: String(explicitFee),
            explicitFee: '0',
        } : {
            explicitServiceCharge: '0',
            explicitFee: String(explicitFee),
        },
        implicitFee: String(implicitFee),
        serviceFee: String(fromReceiptAmountFee),
    }
}

function detectRequestMode (groupedReceipts, invoices, context) {
    const hasReceipts = groupedReceipts && groupedReceipts.length > 0
    const hasInvoices = invoices && invoices.length > 0

    if (!hasReceipts && !hasInvoices) {
        throw new GQLError(ERRORS.MISSING_REQUIRED_INPUT_DATA, context)
    }

    if (hasReceipts && hasInvoices) {
        throw new GQLError(ERRORS.RECEIPTS_WITH_INVOICES_FORBIDDEN, context)
    }

    return hasReceipts ? REQUEST_MODE.RECEIPTS : REQUEST_MODE.INVOICES
}

module.exports = {
    buildCommissionFields,
    calculateTotals,
    detectRequestMode,
}
