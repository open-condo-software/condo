const PHONE_WRONG_FORMAT_ERROR = '[phone:wrongFormat:'
const EMAIL_WRONG_FORMAT_ERROR = '[email:wrongFormat:'

// assume format `[type:error:field] message`
const JSON_EXPECT_OBJECT_ERROR = '[json:expectObject:'
const JSON_EXPECT_ARRAY_ERROR = '[json:expectArray:'
const JSON_NO_NULL_ERROR = '[json:noNull:'
const JSON_UNKNOWN_VERSION_ERROR = '[json:unknownDataVersion:'
const JSON_WRONG_VERSION_FORMAT_ERROR = '[json:wrongDataVersionFormat:'
const JSON_SCHEMA_VALIDATION_ERROR = '[json:schemaValidationError:'
const UNIQUE_ALREADY_EXISTS_ERROR = '[unique:alreadyExists:'
const REQUIRED_NO_VALUE_ERROR = '[required:noValue:'
const REQUIRED = 'REQUIRED'
const DV_VERSION_MISMATCH = 'DV_VERSION_MISMATCH'
const DV_UNKNOWN_VERSION_ERROR = '[dv:unknownDataVersion:'
const STATUS_UPDATED_AT_ERROR = '[dv:incorrectStatusUpdatedAt:'
const UNEQUAL_CONTEXT_ERROR = '[context:unequal:'
const OPERATION_FORBIDDEN = '[operation:forbidden:'

const PROPERTY_REQUIRED_ERROR = '[property:is:empty'
const ALREADY_EXISTS_ERROR = '[constrain:alreadyExists:'
const NOT_FOUND_ERROR = '[constrain:notFound:' // TODO(antonal): replace to `NOT_FOUND` across entire project
const NOT_FOUND = 'NOT_FOUND'

const WRONG_TEXT_FORMAT = '[text:wrongFormat:'

const NOTHING_TO_EXPORT = 'NOTHING_TO_EXPORT'

const NETWORK_ERROR = 'failed to fetch'

const UNIQUE_CONSTRAINT_ERROR = 'duplicate key value violates unique constraint'

// A record with specified set of field values already exists, so, the request violates unique constraints
const NOT_UNIQUE = 'NOT_UNIQUE'
// Provided value does not matches specified format. For example not matches regexp, string length requirement etc.
const WRONG_FORMAT = 'WRONG_FORMAT'
const WRONG_VALUE = 'WRONG_VALUE'
const VALUE_TOO_SHORT = '[value:tooShort:'

const WRONG_PHONE_FORMAT = 'WRONG_PHONE_FORMAT'
const WRONG_PERCENT_VALUE = 'WRONG_PERCENT_VALUE'
const WRONG_EMAIL_VALUE = 'WRONG_EMAIL_VALUE'

const UNKNOWN_ATTRIBUTE = 'UNKNOWN_ATTRIBUTE'

const DUPLICATE_CONSTRAINT_VIOLATION_ERROR_MESSAGE = 'duplicate key value violates unique constraint'

const COMMON_ERRORS = {
    WRONG_PHONE_FORMAT: {
        code: 'BAD_USER_INPUT',
        type: WRONG_PHONE_FORMAT,
        message: 'Wrong phone number format',
        messageForUser: 'api.common.INVALID_PHONE_NUMBER_FORMAT',
    },
    WRONG_EMAIL_FORMAT: {
        code: 'BAD_USER_INPUT',
        type: WRONG_EMAIL_VALUE,
        message: 'Wrong email format',
        messageForUser: 'api.common.INVALID_EMAIL_FORMAT',
    },
    INVALID_PERCENT_VALUE: {
        code: 'BAD_USER_INPUT',
        type: WRONG_PERCENT_VALUE,
        message: 'The percent value must be between 0 and 100',
        messageForUser: 'api.common.WRONG_PERCENT_VALUE',
    },
    DV_VERSION_MISMATCH: {
        variable: ['data', 'dv'],
        code: 'BAD_USER_INPUT',
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        variable: ['data', 'sender'],
        code: 'BAD_USER_INPUT',
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value. {details}',
        correctExample: '{ "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
        messageInterpolation: { details: 'Please, check the example for details' },
    },
}

module.exports = {
    PHONE_WRONG_FORMAT_ERROR,
    EMAIL_WRONG_FORMAT_ERROR,
    JSON_UNKNOWN_VERSION_ERROR,
    JSON_WRONG_VERSION_FORMAT_ERROR,
    JSON_EXPECT_OBJECT_ERROR,
    JSON_EXPECT_ARRAY_ERROR,
    JSON_NO_NULL_ERROR,
    JSON_SCHEMA_VALIDATION_ERROR,
    UNIQUE_ALREADY_EXISTS_ERROR,
    REQUIRED_NO_VALUE_ERROR,
    REQUIRED,
    DV_UNKNOWN_VERSION_ERROR,
    DV_VERSION_MISMATCH,
    ALREADY_EXISTS_ERROR,
    NOT_FOUND_ERROR,
    NOT_FOUND,
    STATUS_UPDATED_AT_ERROR,
    WRONG_TEXT_FORMAT,
    NETWORK_ERROR,
    NOT_UNIQUE,
    NOTHING_TO_EXPORT,
    WRONG_FORMAT,
    WRONG_VALUE,
    WRONG_PHONE_FORMAT,
    WRONG_EMAIL_VALUE,
    UNKNOWN_ATTRIBUTE,
    PROPERTY_REQUIRED_ERROR,
    UNIQUE_CONSTRAINT_ERROR,
    DUPLICATE_CONSTRAINT_VIOLATION_ERROR_MESSAGE,
    UNEQUAL_CONTEXT_ERROR,
    VALUE_TOO_SHORT,
    OPERATION_FORBIDDEN,
    COMMON_ERRORS,
}
