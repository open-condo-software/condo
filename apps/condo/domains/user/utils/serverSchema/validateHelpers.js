const { isString, isEmpty } = require('lodash')

const { GQLError } = require('@open-condo/keystone/errors')

const { SPACES_AT_BEGINNING_OR_END_OF_LINE_REGEX, IDENTICAL_CHARACTERS_REGEX } = require('@condo/domains/user/constants/common')
const { GQL_ERRORS: ERRORS } = require('@condo/domains/user/constants/errors')


/**
 *
 * @param str {string|*}
 * @param substr {string|*}
 * @return {boolean}
 */
const hasSubstring = (str, substr) => {
    if (!isString(str) || isEmpty(str)) return false
    if (!isString(substr) || isEmpty(substr)) return false
    return str.toLowerCase().includes(substr.toLowerCase())
}

const passwordValidations = async (context, pass, email, phone, name) => {
    // Password must be in string format
    if (!isString(pass)) {
        throw new GQLError(ERRORS.WRONG_PASSWORD_FORMAT, context)
    }

    // Password must not start or end with a space
    if (SPACES_AT_BEGINNING_OR_END_OF_LINE_REGEX.test(pass)) {
        throw new GQLError(ERRORS.PASSWORD_CONTAINS_SPACES_AT_BEGINNING_OR_END, context)
    }

    // Password must be of the appropriate length
    if (pass.length < 8 || pass.length > 128) {
        throw new GQLError(ERRORS.INVALID_PASSWORD_LENGTH, context)
    }

    // Password must consist of different characters
    if (IDENTICAL_CHARACTERS_REGEX.test(pass)) {
        throw new GQLError(ERRORS.PASSWORD_CONSISTS_OF_IDENTICAL_CHARACTERS, context)
    }

    // Password must not contain email
    if (hasSubstring(pass, email)) {
        throw new GQLError(ERRORS.PASSWORD_CONTAINS_EMAIL, context)
    }

    // Password must not contain phone
    if (hasSubstring(pass, phone)) {
        throw new GQLError(ERRORS.PASSWORD_CONTAINS_PHONE, context)
    }

    // Password must not contain name
    if (hasSubstring(pass, name)) {
        throw new GQLError(ERRORS.PASSWORD_CONTAINS_NAME, context)
    }
}

module.exports = {
    passwordValidations,
}
