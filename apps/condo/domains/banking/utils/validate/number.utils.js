/*
 * Number validator
 *
 * You need a routing number for validation
 *
 * The following checks are performed:
 * 1) Сheck for emptiness
 * 2) Check for length and format (Consists of 20 digits)
 *
 */

const { getCountrySpecificValidator } = require('@condo/domains/banking/utils/validate/countrySpecificValidators')
const { validateRoutingNumber } = require('@condo/domains/banking/utils/validate/routingNumber.utils')

const EMPTY = 'Number is empty'
const NOT_NUMERIC = 'Number can contain only digits'
const WRONG_LENGTH = 'Number length was expected to be 20, but received '


const validateNumber = (number, routingNumber, country) => {
    const errors = []

    const numberWithoutSpaces = number.toString().trim()
    const routingNumberWithoutSpaces = routingNumber.toString().trim()

    errors.push( ...validateRoutingNumber(routingNumberWithoutSpaces, country).errors )

    if (!numberWithoutSpaces.length) {
        errors.push(EMPTY)
    }
    if (!/^[0-9]*$/.test(numberWithoutSpaces)) {
        errors.push(NOT_NUMERIC)
    }
    if (numberWithoutSpaces.length !== 20) {
        errors.push(WRONG_LENGTH + numberWithoutSpaces.length)
    }

    getCountrySpecificValidator('number', country)(numberWithoutSpaces, routingNumberWithoutSpaces, errors)

    return {
        result: !errors.length,
        errors: errors,
    }
}

module.exports = {
    validateNumber,
}
