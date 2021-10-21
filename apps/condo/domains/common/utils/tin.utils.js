const isString = require('lodash/isString')
const isNumber = require('lodash/isNumber')

const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')

const RU_INN_DIGITS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]
const RU_INN_REGEXP = /^\d{10}$|^\d{12}$/
const RU_ORGANIZATION_INN_REGEXP = /^\d{10}$/

const getInnChecksumRU = num => {
    const n = RU_INN_DIGITS.slice(-num.length)
    let summ = 0

    for (let i = 0; i < num.length; i++) summ += num[i] * n[i]

    let control = summ % 11

    if (control > 9) control = control % 10

    return control
}

const validateInnRU = innValue => {
    if (!isString(innValue) && isNumber(innValue) || !RU_ORGANIZATION_INN_REGEXP.test(innValue)) return false

    const inn = innValue.toString().trim()

    if (inn.length == 10) return getInnChecksumRU(inn) == inn.slice(-1)

    // NOTE: we need INNs only for organizations, that is of 10 chars length.
    // So valid 12 char length person INN doesn`t suit
    if (inn.length == 12) return getInnChecksumRU(inn.slice(0, 11)) == inn.slice(10, -1) && getInnChecksumRU(inn) == inn.slice(-1)

    return false
}

const isValidTin = (tinValue = null, country = RUSSIA_COUNTRY) => {
    if (country === RUSSIA_COUNTRY) return validateInnRU(tinValue)

    // TODO: DOMA-663 add tin validations for countries other than Russian Federation
    return false
}

const getIsValidTin = (country = RUSSIA_COUNTRY) => (tinValue = null) => isValidTin(tinValue, country)

module.exports = {
    validateInnRU,
    isValidTin,
    getIsValidTin,
}
