const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const isString = require('lodash/isString')

const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const {
    MIN_COUNT_OF_DIFFERENT_CHARACTERS_IN_DEVICE_KEY,
    MAX_DEVICE_KEY_LENGTH, MIN_DEVICE_KEY_LENGTH,
} = require('@condo/domains/notification/constants/constants')
const {
    WRONG_DEVICE_KEY_FORMAT,
    INVALID_DEVICE_KEY_LENGTH,
    DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
} = require('@condo/domains/notification/constants/errors')

const DEVICE_KEY_VALIDATIONS_ERRORS = {
    WRONG_DEVICE_KEY_FORMAT: {
        code: BAD_USER_INPUT,
        type: WRONG_DEVICE_KEY_FORMAT,
        variable: ['data', 'deviceKey'],
        message: '"deviceKey" must be in string format',
    },
    INVALID_DEVICE_KEY_LENGTH: {
        code: BAD_USER_INPUT,
        type: INVALID_DEVICE_KEY_LENGTH,
        variable: ['data', 'deviceKey'],
        message: '"deviceKey" length must be between {min} and {max} characters',
        messageInterpolation: {
            min: MIN_DEVICE_KEY_LENGTH,
            max: MAX_DEVICE_KEY_LENGTH,
        },
    },
    DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS: {
        code: BAD_USER_INPUT,
        type: DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
        variable: ['data', 'deviceKey'],
        message: '"deviceKey" must contain at least {min} different characters',
        messageInterpolation: {
            min: MIN_COUNT_OF_DIFFERENT_CHARACTERS_IN_DEVICE_KEY,
        },
    },
}

const UNICODE_CHARS_REGEX = /[\w\W]/gu


function hasDifferentCharacters (str, count = 0) {
    if (!isString(str) || isEmpty(str)) return false

    const chars = str.match(UNICODE_CHARS_REGEX)
    return isArray(chars) && new Set(chars).size >= count
}

function getStringLength (str) {
    if (!isString(str) || isEmpty(str)) return 0

    const chars = str.match(UNICODE_CHARS_REGEX)
    return isArray(chars) ? chars.length : 0
}

function getDeviceKeyValidationError (deviceKey) {
    // deviceKey must be in string format
    if (!isString(deviceKey)) {
        return DEVICE_KEY_VALIDATIONS_ERRORS.WRONG_DEVICE_KEY_FORMAT
    }

    // deviceKey must be of the appropriate length
    const deviceKeyLength = getStringLength(deviceKey)
    if (deviceKeyLength < MIN_DEVICE_KEY_LENGTH || deviceKeyLength > MAX_DEVICE_KEY_LENGTH) {
        return DEVICE_KEY_VALIDATIONS_ERRORS.INVALID_DEVICE_KEY_LENGTH
    }

    // deviceKey must contain at least 4 different characters
    if (!hasDifferentCharacters(deviceKey, MIN_COUNT_OF_DIFFERENT_CHARACTERS_IN_DEVICE_KEY)) {
        return DEVICE_KEY_VALIDATIONS_ERRORS.DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS
    }

    return null
}

module.exports = {
    DEVICE_KEY_VALIDATIONS_ERRORS,
    getDeviceKeyValidationError,
}
