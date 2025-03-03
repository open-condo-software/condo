const crypto = require('crypto')

const { MIN_PASSWORD_LENGTH, MIN_PASSWORD_DIFFERENT_CHARACTERS } = require('@dev-portal-api/domains/user/constants')

const UNICODE_CHARS_REGEX = /[\w\W]/gu

function getStringLength (str){
    const chars = str.match(UNICODE_CHARS_REGEX)
    return Array.isArray(chars) ? chars.length : 0
}

function hasDifferentCharacters (str, amount = 0) {
    const chars = str.match(UNICODE_CHARS_REGEX)
    return Array.isArray(chars) && (new Set(chars)).size >= amount
}

function hasPhoneInside (str, phone, prefixLength = 7) {
    let croppedPhone = phone.length > prefixLength ? phone.substring(phone.length - prefixLength) : phone
    return str.includes(croppedPhone)
}

function isValidPassword (password, extraData = {}) {
    const length = getStringLength(password)
    if (length < MIN_PASSWORD_LENGTH) {
        return false
    }

    if (!hasDifferentCharacters(password, MIN_PASSWORD_DIFFERENT_CHARACTERS)) {
        return false
    }

    return !(extraData.hasOwnProperty('phone') && hasPhoneInside(password, extraData.phone))
}

function generateNumericCode (length = 4) {
    const maxValue = Math.pow(10, length)
    return String(crypto.randomInt(maxValue)).padStart(length, '0')
}

module.exports = {
    isValidPassword,
    generateNumericCode,
}
