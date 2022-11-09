/*
 * Number validator
 *
 * You need a routing number for validation
 *
 * The following checks are performed:
 * 1) Сhecking for emptiness
 * 2) Checking for length and format (Consists of 20 digits)
 *
 * For RU number:
 * 1) Сhecking checksum verification for number
 *
 * Example:
 * number - 50286516400000008106
 * routing number - 823397286
 */

const { validateRoutingNumber } = require('@condo/domains/banking/utils/validate/routingNumber.utils')

//GENERAL ERRORS
const EMPTY = 'Number is empty'
const NOT_NUMERIC = 'Number can contain only digits'
const WRONG_LENGTH = 'Number length was expected to be 20, but received '

//RU ERRORS
const RU_CONTROL_SUM_FAILED = 'Control sum is not valid for number'

const RU_NUMBER_WEIGHTS = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1]

class NumberValidation {

    errors = []

    validateRuNumber (number, routingNumber) {
        const controlString = routingNumber.substr(-3) + number

        let controlSum = 0
        for (const i in RU_NUMBER_WEIGHTS) {
            controlSum += (RU_NUMBER_WEIGHTS[i] * controlString[i]) % 10
        }

        if (controlSum % 10 !== 0) {
            this.errors.push(RU_CONTROL_SUM_FAILED)
        }
    }

    validateNumber (number, routingNumber, country) {
        const numberWithoutSpaces = number.toString().trim()
        const routingNumberWithoutSpaces = routingNumber.toString().trim()

        this.errors.push( ...validateRoutingNumber(routingNumberWithoutSpaces, country).errors )

        if (!numberWithoutSpaces.length) {
            this.errors.push(EMPTY)
        }
        if (!/^[0-9]*$/.test(numberWithoutSpaces)) {
            this.errors.push(NOT_NUMERIC)
        }
        if (numberWithoutSpaces.length !== 20) {
            this.errors.push(WRONG_LENGTH + numberWithoutSpaces.length)
        }

        if (country === 'ru')
            this.validateRuNumber(numberWithoutSpaces, routingNumberWithoutSpaces)

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }
}

const validateNumber = (number, routingNumber, country) => {
    const validator = new NumberValidation()

    const { result, errors } = validator.validateNumber(number, routingNumber, country)
    return { result, errors }
}

module.exports = {
    RU_NUMBER_WEIGHTS,
    validateNumber,
}
