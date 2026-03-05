const { isString, isEmpty } = require('lodash')
const isArray = require('lodash/isArray')

const { GQLError } = require('@open-condo/keystone/errors')

const {
    MIN_COUNT_OF_DIFFERENT_CHARACTERS_IN_PASSWORD,
    MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH,
} = require('@condo/domains/user/constants/common')
const { GQL_ERRORS: ERRORS } = require('@condo/domains/user/constants/errors')


const UNICODE_CHARS_REGEX = /[\w\W]/gu

/**
 * Checks for the presence of a substring in a string, case insensitive
 *
 * @param str {string}
 * @param substr {string}
 * @return {boolean}
 */
const hasCaseInsensitiveSubstring = (str, substr) => {
    if (!isString(str) || isEmpty(str)) return false
    if (!isString(substr) || isEmpty(substr)) return false
    return str.toLowerCase().includes(substr.toLowerCase())
}

/**
 * Counts the number of unique characters in a string and compares with the minimum allowed number
 *
 * @param str {string}
 * @param count {number}
 * @return {boolean}
 * @constructor
 */
const hasDifferentCharacters = (str, count = 0) => {
    if (!isString(str) || isEmpty(str)) return false

    const chars = str.match(UNICODE_CHARS_REGEX)
    return isArray(chars) && new Set(chars).size >= count
}

/**
 * Some characters may have length 2.
 *
 * This method takes these cases into account and returns the correct length value.
 *
 *
 * @example
 *  Use length:
 *
 *      '🤯🤯🤯'.length --> 6
 *      'AAA'.length --> 3
 *
 *  Use getStringLength:
 *
 *      getStringLength('🤯🤯🤯') --> 3
 *      getStringLength('AAA') --> 3
 *
 * @param str {string}
 * @return {number}
 */
const getStringLength = (str) => {
    if (!isString(str) || isEmpty(str)) return 0

    const chars = str.match(UNICODE_CHARS_REGEX)
    return isArray(chars) ? chars.length : 0
}


const passwordValidations = async (context, pass, email, phone) => {
    // Password must be in string format
    if (!isString(pass)) {
        throw new GQLError(ERRORS.WRONG_PASSWORD_FORMAT, context)
    }

    // Password must be of the appropriate length
    const passwordLength = getStringLength(pass)
    if (passwordLength < MIN_PASSWORD_LENGTH || passwordLength > MAX_PASSWORD_LENGTH) {
        throw new GQLError(ERRORS.INVALID_PASSWORD_LENGTH, context)
    }

    // Password must contain at least 4 different characters
    if (!hasDifferentCharacters(pass, MIN_COUNT_OF_DIFFERENT_CHARACTERS_IN_PASSWORD)) {
        throw new GQLError(ERRORS.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS, context)
    }

    // Password must not contain email
    if (hasCaseInsensitiveSubstring(pass, email)) {
        throw new GQLError(ERRORS.PASSWORD_CONTAINS_EMAIL, context)
    }

    // Password must not contain phone
    if (hasCaseInsensitiveSubstring(pass, phone)) {
        throw new GQLError(ERRORS.PASSWORD_CONTAINS_PHONE, context)
    }
}

module.exports = {
    passwordValidations,
}
