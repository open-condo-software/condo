/*
 * TIN validator
 *
 * The following checks are performed:
 * 1) Check for emptiness
 *
 */

const { getCountrySpecificValidator } = require('./countrySpecificValidators')
const EMPTY = 'Tin is empty'

const validateTin = (tin, country) => {
    const errors = []

    const tinWithoutSpaces = tin.toString().trim()

    if (!tin.length) {
        errors.push(EMPTY)
    }

    getCountrySpecificValidator('tin', country)(tinWithoutSpaces, errors)

    return {
        result: !errors.length,
        errors: errors,
    }
}

module.exports = {
    validateTin,
}
