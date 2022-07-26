const faker = require('faker')

const EMPTY = 'Bic is empty'
const NOT_NUMERIC = 'Bic can contain only numeric digits'
const WRONG_LENGTH = 'Bic length was expected to be 9, but received '
const WRONG_COUNTRY = 'For RU organizations country code is 04, but bic have '


class RecipientBicValidation {

    errors = []

    validateForNumbersAndLength (bic) {
        if (!bic.length) {
            this.errors.push(EMPTY)
        }
        if (/[^0-9]/.test(bic)) {
            this.errors.push(NOT_NUMERIC)
        }
        if (bic.length !== 9) {
            this.errors.push(WRONG_LENGTH + bic.length)
        }
    }


    validateBic (bic, country) {
        const bicWithoutSpaces = bic.toString().trim()

        if (country === 'ru') {
            const countryCode = bicWithoutSpaces.substr(0, 2)
            if (countryCode !== '04') {
                this.errors.push(WRONG_COUNTRY + countryCode)
            }

            this.validateForNumbersAndLength(bicWithoutSpaces)
        }

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }
}

function createValidRuBic () {
    return '04' + faker.datatype.number({ min: 1000000, max: 9999999 }).toString()
}


const validateBic = (bic, country = 'ru') => {
    const validator = new RecipientBicValidation()
    const { result, errors } = validator.validateBic(bic, country)
    return { result, errors }
}

module.exports = {
    createValidRuBic,
    validateBic,
}

