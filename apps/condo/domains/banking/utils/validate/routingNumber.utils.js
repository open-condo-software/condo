const { get } = require('lodash')

const { getCountrySpecificValidator } = require('./countrySpecificValidators')

/*
 * Routing number validator
 *
 * The following checks are performed:
 * 1) Сhecking for emptiness
 * 2) Checking for length and format (Consists of 9 digits)
 *
 * Example:
 * RU - 046000987
 */

const EMPTY = 'Routing number is empty'
const NOT_NUMERIC = 'Routing number can contain only digits'
const WRONG_LENGTH = 'Routing number length was expected to be 9, but received '

const validateRoutingNumber = (routingNumber, country) => {
    const errors = []

    const routingNumberWithoutSpaces = routingNumber.toString().trim()
    if (!routingNumberWithoutSpaces.length) {
        errors.push(EMPTY)
    }
    if (!/^[0-9]*$/.test(routingNumberWithoutSpaces)) {
        errors.push(NOT_NUMERIC)
    }
    if (routingNumberWithoutSpaces.length !== 9) {
        errors.push(WRONG_LENGTH + routingNumberWithoutSpaces.length)
    }

    getCountrySpecificValidator('routingNumber', country)(routingNumberWithoutSpaces, errors)

    return {
        result: !errors.length,
        errors: errors,
    }
}

module.exports = {
    validateRoutingNumber,
}
