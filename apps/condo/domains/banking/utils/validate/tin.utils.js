/*
 * TIN validator
 *
 * The following checks are performed:
 * 1) Сhecking for emptiness
 *
 * For RU tin:
 * 1) Сhecking checksum verification for TIN
 * 2) Checking for length and format (Consists of 10 or 12 digits)
 *
 * Example:
 * RU TIN with 10 characters - 7791815382
 * RU TIN with 12 characters - 397144170672
 */

//GENERAL ERRORS
const EMPTY = 'Tin is empty'
const NOT_NUMERIC = 'Tin can contain only numeric digits'

//RU ERRORS
const WRONG_LENGTH_RU = 'Ru tin length was expected to be 10 or 12, but received '
const RU_CONTROL_SUM_FAILED = 'Control sum is not valid for tin'
const RU_TIN_WEIGHTS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]


function getTinControlSumRU (num) {
    const weights = RU_TIN_WEIGHTS.slice(-num.length)

    let controlSum = 0

    for (let i = 0; i < num.length; i++)
        controlSum += num[i] * weights[i]

    return controlSum % 11 % 10
}


class TinValidation {

    errors = []

    validateRuTin (tin) {
        if (!/^[0-9]*$/.test(tin)) this.errors.push(NOT_NUMERIC)

        if (tin.length !== 10 && tin.length !== 12) this.errors.push(WRONG_LENGTH_RU + tin.length)

        if (tin.length === 10)
            if (getTinControlSumRU(tin) !== Number(tin.slice(-1))) {
                this.errors.push(RU_CONTROL_SUM_FAILED)
            }

        if (tin.length === 12)
            if (getTinControlSumRU(tin.slice(0, 11)) !== Number(tin.slice(10, -1)
                || getTinControlSumRU(tin) !== Number(tin.slice(-1)))) {
                this.errors.push(RU_CONTROL_SUM_FAILED)
            }
    }

    validateTin (tin, country) {
        const tinWithoutSpaces = tin.toString().trim()

        if (!tin.length) {
            this.errors.push(EMPTY)
        }

        if (country === 'RU')
            return this.validateRuTin(tinWithoutSpaces)

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }
}

const validateTin = (tin, country) => {
    const validator = new TinValidation()

    const { result, errors } = validator.validateTin(tin, country)
    return { result, errors }
}

module.exports = {
    getTinControlSumRU,
    validateTin,
}
