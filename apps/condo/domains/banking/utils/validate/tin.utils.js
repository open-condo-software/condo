/*
 * TIN validator
 *
 * The following checks are performed:
 * 1) Check for emptiness
 *
 */

const { RU_TIN_WEIGHTS } = require('@condo/domains/banking/utils/validate/constants')

const EMPTY = 'Tin is empty'
const NOT_NUMERIC = 'Tin can contain only digits'

const COUNTRY_SPECIFIC_VALIDATIONS = {
    /**
     * For RU tin:
     * 1) Сhecking checksum verification for TIN
     * 2) Checking for length and format (Consists of 10 or 12 digits)
     *  *
     * Example:
     * RU TIN with 10 characters - 7791815382
     * RU TIN with 12 characters - 397144170672
     */
    'ru': (tin, errors) => {
        const WRONG_LENGTH_RU = 'Ru tin length was expected to be 10 or 12, but received '
        const RU_CONTROL_SUM_FAILED = 'Control sum is not valid for tin'

        if (!/^[0-9]*$/.test(tin)) errors.push(NOT_NUMERIC)

        if (tin.length !== 10 && tin.length !== 12) errors.push(WRONG_LENGTH_RU + tin.length)

        if (tin.length === 10)
            if (getTinControlSumRU(tin) !== Number(tin.slice(-1))) {
                errors.push(RU_CONTROL_SUM_FAILED)
            }

        if (tin.length === 12) {
            if (getTinControlSumRU(tin.slice(0, 11)) !==
                Number(tin.slice(10, -1)
                    || getTinControlSumRU(tin) !== Number(tin.slice(-1)))) {
                errors.push(RU_CONTROL_SUM_FAILED)
            }
        }
    },
}

function getTinControlSumRU (num) {
    const weights = RU_TIN_WEIGHTS.slice(-num.length)

    let controlSum = 0
    for (let i = 0; i < num.length; i++)
        controlSum += num[i] * weights[i]

    return controlSum % 11 % 10
}

const validateTin = (tin, country) => {
    const errors = []

    const tinWithoutSpaces = tin.toString().trim()

    if (!tin.length) {
        errors.push(EMPTY)
    }

    const countrySpecificValidator = COUNTRY_SPECIFIC_VALIDATIONS[country]
    if (countrySpecificValidator) { countrySpecificValidator( tinWithoutSpaces, errors ) }

    return {
        result: !errors.length,
        errors: errors,
    }
}

module.exports = {
    validateTin,
    getTinControlSumRU,
}
