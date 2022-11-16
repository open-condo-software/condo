const { get } = require('lodash')

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

const COUNTRY_SPECIFIC_VALIDATORS = {
    /**
     * For RU routing number:
     * *** In Russia, number routing is equivalent to BIC***
     * 1) For RU organizations country code (first two digits) is 04
     *
     * @param {string} routingNumber
     * @param {[]} errors
     */
    'ru': (routingNumber, errors) => {
        const WRONG_RU_COUNTRY_CODE = 'For RU organizations country code is 04, but routing number have '

        const countryCode = routingNumber.substr(0, 2)

        if (countryCode !== '04') {
            errors.push(WRONG_RU_COUNTRY_CODE + countryCode)
        }
    },
}

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

    const countrySpecificValidator = get(COUNTRY_SPECIFIC_VALIDATORS, country, null)
    if (countrySpecificValidator) { countrySpecificValidator(routingNumberWithoutSpaces, errors) }

    return {
        result: !errors.length,
        errors: errors,
    }
}

module.exports = {
    validateRoutingNumber,
}
