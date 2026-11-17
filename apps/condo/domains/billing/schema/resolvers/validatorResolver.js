const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { createStageContext } = require('@condo/domains/billing/schema/resolvers/resolver')
const { isValidBillingYear } = require('@condo/domains/billing/schema/resolvers/utils')

const MONEY_FIELDS = ['charge', 'balance', 'recalculation', 'privilege', 'penalty', 'paid']
const MONEY_REGEXP = /^-?\d+(?:\.\d+)?$/

function validateAmount (value, field, index, error) {
    if (value === null || value === undefined) return null
    if (typeof value !== 'string' || !MONEY_REGEXP.test(value)) {
        return error(ERRORS.WRONG_AMOUNT_FORMAT, index, null, { field, value: String(value) })
    }
    return null
}

function validateAmounts (receipt, index, error) {
    const values = [{ value: receipt.toPay, field: 'toPay' }]
    for (const field of MONEY_FIELDS) {
        values.push({ value: receipt.toPayDetails?.[field], field: `toPayDetails.${field}` })
    }
    for (const [serviceIndex, service] of (receipt.services || []).entries()) {
        if (!service) {
            return error(ERRORS.WRONG_AMOUNT_FORMAT, index, null, {
                field: `services.${serviceIndex}`,
                value: String(service),
            })
        }
        values.push({ value: service.toPay, field: `services.${serviceIndex}.toPay` })
        for (const field of MONEY_FIELDS) {
            values.push({ value: service.toPayDetails?.[field], field: `services.${serviceIndex}.toPayDetails.${field}` })
        }
    }
    for (const { value, field } of values) {
        const amountError = validateAmount(value, field, index, error)
        if (amountError) return amountError
    }
    return null
}

function resolveValidation (receiptIndex, { context }) {
    const stage = createStageContext({ name: 'validator', context })
    for (const [index, receipt] of Object.entries(receiptIndex)) {
        if (receipt.month < 1 || receipt.month > 12) {
            receipt.error = stage.error(ERRORS.WRONG_MONTH, index)
            continue
        }
        if (!isValidBillingYear(receipt.year)) {
            receipt.error = stage.error(ERRORS.WRONG_YEAR, index)
            continue
        }
        const amountError = validateAmounts(receipt, index, stage.error)
        if (amountError) receipt.error = amountError
    }
    return stage.result(receiptIndex)
}

module.exports = {
    resolveValidation,
}
