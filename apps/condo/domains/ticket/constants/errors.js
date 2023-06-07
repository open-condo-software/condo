const UNKNOWN_GROUP_BY_FILTER = 'UNKNOWN_GROUP_BY_FILTER'
const INVALID_PHONE_NUMBER_FORMAT = 'INVALID_PHONE_NUMBER_FORMAT'

const INVALID_PHONE_NUMBER_FORMAT_MESSAGE = 'Invalid phone number format, should start with +'

const CALL_RECORD_ERRORS = {
    INVALID_CALLER_PHONE_NUMBER_FORMAT: {
        code: 'BAD_USER_INPUT',
        type: INVALID_PHONE_NUMBER_FORMAT,
        message: INVALID_PHONE_NUMBER_FORMAT_MESSAGE,
        variable: ['data', 'callerPhone'],
    },
    INVALID_DEST_CALLER_PHONE_NUMBER_FORMAT: {
        code: 'BAD_USER_INPUT',
        type: INVALID_PHONE_NUMBER_FORMAT,
        message: INVALID_PHONE_NUMBER_FORMAT_MESSAGE,
        variable: ['data', 'destCallerPhone'],
    },
}

module.exports = {
    UNKNOWN_GROUP_BY_FILTER,
    INVALID_PHONE_NUMBER_FORMAT,
    CALL_RECORD_ERRORS,
}