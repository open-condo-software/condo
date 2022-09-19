/*
 * Routing number validator
 *
 * The following checks are performed:
 * 1) Сhecking for emptiness
 * 2) Checking for length and format (Consists of 9 digits)
 *
 * For RU routing number:
 * 1) For RU organizations country code (first two digits) is 04
 *
 * Example:
 * RU - 046000987
 */

//GENERAL ERRORS
const EMPTY = 'Routing number is empty'
const NOT_NUMERIC = 'Routing number can contain only numeric digits'
const WRONG_LENGTH = 'Routing number length was expected to be 9, but received '

//RU ERRORS
const WRONG_RU_COUNTRY_CODE = 'For RU organizations country code is 04, but routing number have '


class RoutingNumberValidation {

    errors = []

    validateRuRoutingNumber (routingNumber) {
        const countryCode = routingNumber.substr(0, 2)

        if (countryCode !== '04') {
            this.errors.push(WRONG_RU_COUNTRY_CODE + countryCode)
        }
    }

    validateRoutingNumber (routingNumber, country) {
        const routingNumberWithoutSpaces = routingNumber.toString().trim()

        if (!routingNumberWithoutSpaces.length) {
            this.errors.push(EMPTY)
        }
        if (!/^[0-9]*$/.test(routingNumberWithoutSpaces)) {
            this.errors.push(NOT_NUMERIC)
        }
        if (routingNumberWithoutSpaces.length !== 9) {
            this.errors.push(WRONG_LENGTH + routingNumberWithoutSpaces.length)
        }

        if (country === 'RU')
            return this.validateRuRoutingNumber(routingNumberWithoutSpaces)

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }
}

const validateRoutingNumber = (routingNumber, country) => {
    const validator = new RoutingNumberValidation()

    const { result, errors } = validator.validateRoutingNumber(routingNumber, country)
    return { result, errors }
}

module.exports = {
    validateRoutingNumber,
}
