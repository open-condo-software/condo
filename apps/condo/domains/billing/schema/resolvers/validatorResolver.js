const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')

const MONEY_FIELDS = ['charge', 'balance', 'recalculation', 'privilege', 'penalty', 'paid']
const MONEY_REGEXP = /^-?\d+(?:\.\d+)?$/

class ValidatorResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'validator' })
    }

    validateAmount (value, field, index) {
        if (value === null || value === undefined) return null
        if (typeof value !== 'string' || !MONEY_REGEXP.test(value)) {
            return this.error(ERRORS.WRONG_AMOUNT_FORMAT, index, null, { field, value: String(value) })
        }
        return null
    }

    validateAmounts (receipt, index) {
        const values = [{ value: receipt.toPay, field: 'toPay' }]
        for (const field of MONEY_FIELDS) {
            values.push({ value: receipt.toPayDetails?.[field], field: `toPayDetails.${field}` })
        }
        for (const [serviceIndex, service] of (receipt.services || []).entries()) {
            if (!service) {
                return this.error(ERRORS.WRONG_AMOUNT_FORMAT, index, null, {
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
            const error = this.validateAmount(value, field, index)
            if (error) return error
        }
        return null
    }

    async processReceipts (receiptIndex) {
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            if (receipt.month < 1 || receipt.month > 12) {
                receipt.error = this.error(ERRORS.WRONG_MONTH, index)
                continue
            }
            if (!receipt.year || String(receipt.year).length !== 4) {
                receipt.error = this.error(ERRORS.WRONG_YEAR, index)
                continue
            }
            const amountError = this.validateAmounts(receipt, index)
            if (amountError) receipt.error = amountError
        }
        return this.result(receiptIndex)
    }
}

module.exports = {
    ValidatorResolver,
}
