const EMPTY = 'Bic is empty'
const NOT_NUMERIC = 'Bic can contain only numeric digits'
const WRONG_LENGTH = 'Bic length was expected to be 9, but received '
const WRONG_COUNTRY = 'Only RU organizations are supported'


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


    validateBic (bic) {
        const bicWithoutSpaces = bic.toString().trim()
        this.validateForNumbersAndLength(bicWithoutSpaces)

        if (bicWithoutSpaces.substr(0, 2) !== '04') {
            this.errors.push(WRONG_COUNTRY)
        }

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }
}

const validateBic = (bic) => {
    const validator = new RecipientBicValidation()
    const { result, errors } = validator.validateBic(bic)
    return { result, errors }
}

module.exports = {
    validateBic,
}

