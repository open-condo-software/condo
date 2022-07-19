const EMPTY = 'Iec is empty'
const WRONG_FORMAT = 'Invalid iec format'
const WRONG_LENGTH = 'Iec length was expected to be 9, but received '


class RecipientIecValidation {

    errors = []

    validateIec (iec) {
        if (!iec.length) {
            this.errors.push(EMPTY)
        }

        if (iec.length !== 9) {
            this.errors.push(WRONG_LENGTH + iec.length)
        }

        if (!/^[0-9]{4}[0-9A-Z]{2}[0-9]{3}$/.test(iec)) {
            this.errors.push(WRONG_FORMAT)
        }

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }

}

const validateIec = (iec) => {
    const validator = new RecipientIecValidation()
    const { result, errors } = validator.validateIec(iec)
    return { result, errors }
}

module.exports = {
    validateIec,
}

