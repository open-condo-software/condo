const { Decimal } = require('@open-keystone/fields')
const Big = require('big.js')
const get = require('lodash/get')

const AVAILABLE_TYPES = ['negative', 'positive', 'non-negative', 'non-positive']

class SignedDecimal extends Decimal.implementation {
    constructor () {
        super(...arguments)
        const template = get(this.config, 'template')
        if (!template || !AVAILABLE_TYPES.includes(template)) {
            throw new Error(`Type of decimal (template) was not correct for SignedDecimal field of ${this.listKey}.${this.path}. Expected one of this: [${AVAILABLE_TYPES.map(type => `"${type}"`).join(', ')}], but got: ${template}`)
        }
        this.decimalType = template
    }

    async validateInput (args) {
        const { resolvedData, fieldPath, addFieldValidationError } = args
        // Admin UI cannot explicitly pass null, so we treat an empty string as null for values where an empty string is not allowed.
        if (resolvedData[fieldPath] === '') resolvedData[fieldPath] = null
        if (resolvedData.hasOwnProperty(fieldPath) && resolvedData[fieldPath] !== null) {
            const decimal = Big(resolvedData[fieldPath])
            let checkPassed = false
            switch (this.decimalType) {
                case 'negative':
                    checkPassed = decimal.lt(0)
                    break
                case 'positive':
                    checkPassed = decimal.gt(0)
                    break
                case 'non-negative':
                    checkPassed = decimal.gte(0)
                    break
                case 'non-positive':
                    checkPassed = decimal.lte(0)
                    break
            }
            if (!checkPassed) {
                addFieldValidationError(`[${fieldPath}:${this.decimalType}] Specified number has an invalid sign. Field value should be ${this.decimalType}`)            }
        }
        await super.validateInput(args)
    }
}

module.exports = {
    SignedDecimal,
}
