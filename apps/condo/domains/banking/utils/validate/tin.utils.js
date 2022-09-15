/*
 * TIN validator
 *
 * The following checks are performed:
 * 1) Сhecking for emptiness
 * 2) Checking for length and format (Consists of 10 or 12 digits)
 *
 * For RU tin:
 * 1) Сhecking checksum verification for TIN
 *
 * Example:
 * TIN with 10 characters - 7791815382
 * TIN with 12 characters - 397144170672
 */

const EMPTY = 'Tin is empty'
const NOT_NUMERIC = 'Tin can contain only numeric digits'
const WRONG_LENGTH = 'Tin length was expected to be 10 or 12, but received '
const CONTROL_SUM_FAILED = 'Control sum is not valid for tin'

const RU_TIN_DIGITS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]


function getTinControlSumRU (num) {
    const weights = RU_TIN_DIGITS.slice(-num.length)
    let sum = 0

    for (let i = 0; i < num.length; i++)
        sum += num[i] * weights[i]

    return sum % 11 % 10
}

class RecipientTinValidation {

    errors = []

    validateForNumbersAndLength (tin) {
        if (!tin.length) {
            this.errors.push(EMPTY)
        }

        if (!/^[0-9]*$/.test(tin)) {
            this.errors.push(NOT_NUMERIC)
        }

        if (tin.length !== 10 && tin.length !== 12) {
            this.errors.push(WRONG_LENGTH + tin.length)
        }
    }


    validateTin (tin, country) {
        const tinWithoutSpaces = tin.toString().trim()

        this.validateForNumbersAndLength(tinWithoutSpaces)

        if (tinWithoutSpaces.length === 10)
            if (getTinControlSumRU(tinWithoutSpaces) !== Number(tinWithoutSpaces.slice(-1))) {
                this.errors.push(CONTROL_SUM_FAILED)
            }

        if (tinWithoutSpaces.length === 12)
            if (getTinControlSumRU(tinWithoutSpaces.slice(0, 11)) !== Number(tinWithoutSpaces.slice(10, -1)
                || getTinControlSumRU(tinWithoutSpaces) !== Number(tinWithoutSpaces.slice(-1)))) {
                this.errors.push(CONTROL_SUM_FAILED)
            }

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }
}

const validateTin = (tin, country) => {
    const validator = new RecipientTinValidation()
    const { result, errors } = validator.validateTin(tin, country)
    return { result, errors }
}

module.exports = {
    getTinControlSumRU,
    validateTin,
}
