const { getCountrySpecificValidator } = require('./countrySpecificValidators')

/*
 * Classification code validator
 *
 * The following check is performed:
 * 1) Сhecking for emptiness
 *
 * Example:
 * RU - 90205039900060030131
 */

const EMPTY = 'Classification code is empty'
const NOT_NUMERIC = 'Classification code can contain only digits'

const validateClassificationCode = (routingNumber, country) => {
    const errors = []

    const classificationCodeWithoutSpaces = routingNumber.toString().trim()
    if (!classificationCodeWithoutSpaces.length) {
        errors.push(EMPTY)
    }
    if (!/^[0-9]*$/.test(classificationCodeWithoutSpaces)) {
        errors.push(NOT_NUMERIC)
    }

    getCountrySpecificValidator('classificationCode', country)(classificationCodeWithoutSpaces, errors)

    return {
        result: !errors.length,
        errors: errors,
    }
}

module.exports = {
    validateClassificationCode,
}
