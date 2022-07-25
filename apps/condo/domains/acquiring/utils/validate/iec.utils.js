const EMPTY = 'Iec is empty'
const WRONG_FORMAT = 'Invalid iec format'
const WRONG_LENGTH = 'Iec length was expected to be 9, but received '


class RecipientIecValidation {

    errors = []

    validateIec (iec) {
        const iecWithoutSpaces = iec.toString().trim()

        if (!iecWithoutSpaces.length) {
            this.errors.push(EMPTY)
        }

        if (iecWithoutSpaces.length !== 9) {
            this.errors.push(WRONG_LENGTH + iecWithoutSpaces.length)
        }

        if (!/^[0-9]{4}[0-9A-Z]{2}[0-9]{3}$/.test(iecWithoutSpaces)) {
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

