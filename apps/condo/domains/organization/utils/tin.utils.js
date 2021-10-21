const isString = require('lodash/isString')
const isNumber = require('lodash/isNumber')

const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')

const RU_TIN_DIGITS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]
const RU_ORGANIZATION_TIN_REGEXP = /^\d{10}$/

const getTinChecksumRU = num => {
    const n = RU_TIN_DIGITS.slice(-num.length)
    let summ = 0

    for (let i = 0; i < num.length; i++) summ += num[i] * n[i]

    let control = summ % 11

    if (control > 9) control = control % 10

    return control
}

const validateTinRU = tinValue => {
    if (!isString(tinValue) && isNumber(tinValue) || !RU_ORGANIZATION_TIN_REGEXP.test(tinValue)) return false

    const inn = tinValue.toString().trim()

    if (inn.length == 10) return getTinChecksumRU(inn) == inn.slice(-1)

    // NOTE: we need INNs only for organizations, that is of 10 chars length.
    // So valid 12 char length person INN doesn`t suit
    if (inn.length == 12) return getTinChecksumRU(inn.slice(0, 11)) == inn.slice(10, -1) && getTinChecksumRU(inn) == inn.slice(-1)

    return false
}

const isValidTin = (tinValue = null, country = RUSSIA_COUNTRY) => {
    if (country === RUSSIA_COUNTRY) return validateTinRU(tinValue)

    // TODO: DOMA-663 add tin validations for countries other than Russian Federation
    return false
}

const getIsValidTin = (country = RUSSIA_COUNTRY) => (tinValue = null) => isValidTin(tinValue, country)

module.exports = {
    validateTinRU,
    isValidTin,
    getIsValidTin,
}
