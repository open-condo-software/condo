const { GQLError } = require('@open-condo/keystone/errors')

const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { isValidBillingYear } = require('@condo/domains/billing/schema/resolvers/utils')

const MONEY_FIELDS = ['charge', 'balance', 'recalculation', 'privilege', 'penalty', 'paid']
const MONEY_REGEXP = /^-?\d+(?:\.\d+)?$/

function throwInputError (error, inputIndex, messageInterpolation, context) {
    throw new GQLError({
        ...error,
        inputIndex,
        messageInterpolation,
    }, context)
}

function validateAmount (value, field, inputIndex, context) {
    if (value === null || value === undefined) return
    if (typeof value !== 'string' || !MONEY_REGEXP.test(value)) {
        throwInputError(ERRORS.WRONG_AMOUNT_FORMAT, inputIndex, { field, value: String(value) }, context)
    }
}

function validateAmounts (receipt, inputIndex, context) {
    validateAmount(receipt.toPay, 'toPay', inputIndex, context)
    for (const field of MONEY_FIELDS) {
        validateAmount(receipt.toPayDetails?.[field], `toPayDetails.${field}`, inputIndex, context)
    }
    for (const [serviceIndex, service] of (receipt.services || []).entries()) {
        if (!service) {
            throwInputError(ERRORS.WRONG_AMOUNT_FORMAT, inputIndex, {
                field: `services.${serviceIndex}`,
                value: String(service),
            }, context)
        }
        validateAmount(service.toPay, `services.${serviceIndex}.toPay`, inputIndex, context)
        for (const field of MONEY_FIELDS) {
            validateAmount(service.toPayDetails?.[field], `services.${serviceIndex}.toPayDetails.${field}`, inputIndex, context)
        }
    }
}

function validateReceiptInputs (receipts, context) {
    for (const [inputIndex, receipt] of receipts.entries()) {
        if (receipt.month < 1 || receipt.month > 12) {
            throwInputError(ERRORS.WRONG_MONTH, inputIndex, { month: receipt.month }, context)
        }
        if (!isValidBillingYear(receipt.year)) {
            throwInputError(ERRORS.WRONG_YEAR, inputIndex, { year: receipt.year }, context)
        }
        validateAmounts(receipt, inputIndex, context)
    }
}

module.exports = {
    validateReceiptInputs,
}
