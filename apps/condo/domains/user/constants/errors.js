const { pick } = require('lodash')

const { NOT_UNIQUE, WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')

const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MIN_COUNT_OF_DIFFERENT_CHARACTERS_IN_PASSWORD } = require('./common')

const WRONG_PASSWORD_ERROR = '[passwordAuth:secret:mismatch'
const EMPTY_PASSWORD_ERROR = '[passwordAuth:secret:notSet'
const WRONG_EMAIL_ERROR = '[passwordAuth:identity:notFound'
const WRONG_PHONE_ERROR = '[passwordAuth:identity:notFound'
const AUTH_BY_PASSWORD_FAILED_ERROR = '[passwordAuth:failure'

const MULTIPLE_ACCOUNTS_MATCHES = '[resetPassword:identity:multipleFound'
const TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND'
const USER_NOT_FOUND = 'USER_NOT_FOUND'
const DENIED_FOR_ADMIN = 'DENIED_FOR_ADMIN'
const DENIED_FOR_SUPPORT = 'DENIED_FOR_SUPPORT'
const WRONG_CREDENTIALS = 'WRONG_CREDENTIALS'

const UNABLE_TO_CREATE_USER = 'UNABLE_TO_CREATE_USER'

const UNABLE_TO_CREATE_CONTACT_DUPLICATE = 'UNABLE_TO_CREATE_CONTACT'
const UNABLE_TO_UPDATE_CONTACT_DUPLICATE = 'UNABLE_TO_UPDATE_CONTACT_DUPLICATE'

const TOKEN_EXPIRED_ERROR = '[resetPassword:token:expired'

const MIN_PASSWORD_LENGTH_ERROR = '[register:password:minLength'
const PASSWORD_TOO_SHORT = '[password:min:length'

const EMAIL_ALREADY_REGISTERED_ERROR = '[unique:email:multipleFound'
const PHONE_ALREADY_REGISTERED_ERROR = '[unique:phone:multipleFound'

const EMAIL_WRONG_FORMAT_ERROR = '[format:email'
const PHONE_WRONG_FORMAT_ERROR = '[format:phone'

const PHONE_IS_REQUIRED_ERROR = '[phone:required'

const PASSWORD_IS_FREQUENTLY_USED_ERROR = '[password:rejectCommon'
const CONFIRM_PHONE_ACTION_EXPIRED = '[confirm:phone:expired'
const CONFIRM_PHONE_SMS_CODE_EXPIRED = '[confirm:phone:smscode:expired'
const SMS_CODE_EXPIRED = 'SMS_CODE_EXPIRED'
const EMAIL_CODE_EXPIRED = 'EMAIL_CODE_EXPIRED'
const CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED = '[confirm:phone:smscode:verify:failed'
const SMS_CODE_VERIFICATION_FAILED = 'SMS_CODE_VERIFICATION_FAILED'
const EMAIL_CODE_VERIFICATION_FAILED = 'EMAIL_CODE_VERIFICATION_FAILED'
const CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED = '[confirm:phone:smscode:tooManyRequests'
const SMS_CODE_MAX_RETRIES_REACHED = 'SMS_CODE_MAX_RETRIES_REACHED'
const EMAIL_CODE_MAX_RETRIES_REACHED = 'EMAIL_CODE_MAX_RETRIES_REACHED'

const TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS'
const SMS_FOR_PHONE_DAY_LIMIT_REACHED = 'SMS_FOR_PHONE_DAY_LIMIT_REACHED'
const SMS_FOR_IP_DAY_LIMIT_REACHED = 'SMS_FOR_IP_DAY_LIMIT_REACHED'
const DAILY_REQUEST_LIMIT_FOR_IP_REACHED = 'DAILY_REQUEST_LIMIT_FOR_IP_REACHED'
const DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED = 'DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED'
const DAILY_REQUEST_LIMIT_FOR_EMAIL_REACHED = 'DAILY_REQUEST_LIMIT_FOR_EMAIL_REACHED'
const DAILY_REQUEST_LIMIT_FOR_USER_REACHED = 'DAILY_REQUEST_LIMIT_FOR_USER_REACHED'
const TOTAL_REQUEST_LIMIT_FOR_USER_REACHED = 'TOTAL_REQUEST_LIMIT_FOR_USER_REACHED'
const TOTAL_REQUEST_LIMIT_FOR_EMAIL_REACHED = 'TOTAL_REQUEST_LIMIT_FOR_EMAIL_REACHED'
const TOTAL_REQUEST_LIMIT_FOR_PHONE_REACHED = 'TOTAL_REQUEST_LIMIT_FOR_PHONE_REACHED'

const REQUEST_LIMIT_ERRORS = [
    DAILY_REQUEST_LIMIT_FOR_IP_REACHED,
    DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED,
    DAILY_REQUEST_LIMIT_FOR_EMAIL_REACHED,
    DAILY_REQUEST_LIMIT_FOR_USER_REACHED,
    TOTAL_REQUEST_LIMIT_FOR_USER_REACHED,
    TOTAL_REQUEST_LIMIT_FOR_EMAIL_REACHED,
    TOTAL_REQUEST_LIMIT_FOR_PHONE_REACHED,
]

const CAPTCHA_CHECK_FAILED = 'CAPTCHA_CHECK_FAILED'

const UNABLE_TO_FIND_CONFIRM_PHONE_ACTION = 'UNABLE_TO_FIND_CONFIRM_PHONE_ACTION'
const UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION = 'UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION'
const NO_CONFIRM_PHONE_ACTION_TOKEN = 'NO_CONFIRM_PHONE_ACTION_TOKEN'
const CANNOT_RESET_ADMIN_USER = 'CANNOT_RESET_ADMIN_USER'

const EMPTY_EXTERNAL_IDENTITY_ID_VALUE = 'EMPTY_EXTERNAL_IDENTITY_ID_VALUE'

const WRONG_PASSWORD_FORMAT = 'WRONG_PASSWORD_FORMAT'
const INVALID_PASSWORD_LENGTH = 'INVALID_PASSWORD_LENGTH'
const PASSWORD_CONTAINS_EMAIL = 'PASSWORD_CONTAINS_EMAIL'
const PASSWORD_CONTAINS_PHONE = 'PASSWORD_CONTAINS_PHONE'
const PASSWORD_IS_FREQUENTLY_USED = 'PASSWORD_IS_FREQUENTLY_USED'
const PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS = 'PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS'
const INVALID_EXTERNAL_PHONE = 'INVALID_EXTERNAL_PHONE'
const INVALID_EXTERNAL_EMAIL = 'INVALID_EXTERNAL_EMAIL'
const INVALID_EXTERNAL_SYSTEM = 'INVALID_EXTERNAL_SYSTEM'

const GENERATE_TOKEN_FAILED = 'GENERATE_TOKEN_FAILED'
const INVALID_TOKEN = 'INVALID_TOKEN'
const UNSUPPORTED_TOKEN = 'UNSUPPORTED_TOKEN'

const CREDENTIAL_VALIDATION_FAILED = 'CREDENTIAL_VALIDATION_FAILED'
const USER_IDENTITY_INVALID = 'USER_IDENTITY_INVALID'
const NOT_ENOUGH_AUTH_FACTORS = 'NOT_ENOUGH_AUTH_FACTORS'

const USER_EXTERNAL_IDENTITY_WRONG_USER_TYPE = 'USER_EXTERNAL_IDENTITY_WRONG_USER_TYPE'
const USER_EXTERNAL_IDENTITY_WRONG_IDENTITY_TYPE = 'USER_EXTERNAL_IDENTITY_WRONG_IDENTITY_TYPE'

const GQL_ERRORS = {
    TOO_MANY_REQUESTS: {
        // TODO(pahaz): it' looks like a wrong code. Use TOO_MANY_REQUESTS
        code: 'BAD_USER_INPUT',
        type: TOO_MANY_REQUESTS,
        message: 'You have to wait {minutesRemaining} min. to be able to send request again',
        messageForUser: 'api.user.TOO_MANY_REQUESTS',
        messageInterpolation: { minutesRemaining: 100 },
    },
    SMS_FOR_PHONE_DAY_LIMIT_REACHED: {
        code: 'BAD_USER_INPUT',
        type: SMS_FOR_PHONE_DAY_LIMIT_REACHED,
        message: 'Too many sms requests for this phone number. Try again tomorrow',
        messageForUser: 'api.user.SMS_FOR_PHONE_DAY_LIMIT_REACHED',
    },
    SMS_FOR_IP_DAY_LIMIT_REACHED: {
        code: 'BAD_USER_INPUT',
        type: SMS_FOR_IP_DAY_LIMIT_REACHED,
        message: 'Too many sms requests from this ip address. Try again tomorrow',
        messageForUser: 'api.user.SMS_FOR_IP_DAY_LIMIT_REACHED',
    },
    DAILY_REQUEST_LIMIT_FOR_IP_REACHED: {
        code: 'BAD_USER_INPUT',
        type: DAILY_REQUEST_LIMIT_FOR_IP_REACHED,
        message: 'Too many requests from this ip address. Try again later',
        messageForUser: 'api.user.DAILY_REQUEST_LIMIT_FOR_IP_REACHED',
    },
    DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED: {
        code: 'BAD_USER_INPUT',
        type: DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED,
        message: 'Too many requests with this phone. Try again later',
        messageForUser: 'api.user.DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED',
    },
    DAILY_REQUEST_LIMIT_FOR_EMAIL_REACHED: {
        code: 'BAD_USER_INPUT',
        type: DAILY_REQUEST_LIMIT_FOR_EMAIL_REACHED,
        message: 'Too many requests with this phone. Try again later',
        messageForUser: 'api.user.DAILY_REQUEST_LIMIT_FOR_EMAIL_REACHED',
    },
    DAILY_REQUEST_LIMIT_FOR_USER_REACHED: {
        code: 'BAD_USER_INPUT',
        type: DAILY_REQUEST_LIMIT_FOR_USER_REACHED,
        message: 'Too many requests from this user. Try again later',
        messageForUser: 'api.user.DAILY_REQUEST_LIMIT_FOR_USER_REACHED',
    },
    TOTAL_REQUEST_LIMIT_FOR_USER_REACHED: {
        code: 'BAD_USER_INPUT',
        type: TOTAL_REQUEST_LIMIT_FOR_USER_REACHED,
        message: 'Too many requests from this user. Try again later',
        messageForUser: 'api.user.TOTAL_REQUEST_LIMIT_FOR_USER_REACHED',
    },
    TOTAL_REQUEST_LIMIT_FOR_EMAIL_REACHED: {
        code: 'BAD_USER_INPUT',
        type: TOTAL_REQUEST_LIMIT_FOR_EMAIL_REACHED,
        message: 'Too many requests from this email. Try again later',
        messageForUser: 'api.user.TOTAL_REQUEST_LIMIT_FOR_EMAIL_REACHED',
    },
    TOTAL_REQUEST_LIMIT_FOR_PHONE_REACHED: {
        code: 'BAD_USER_INPUT',
        type: TOTAL_REQUEST_LIMIT_FOR_PHONE_REACHED,
        message: 'Too many requests from this phone. Try again later',
        messageForUser: 'api.user.TOTAL_REQUEST_LIMIT_FOR_PHONE_REACHED',
    },
    WRONG_PASSWORD_FORMAT: {
        variable: ['data', 'password'],
        code: 'BAD_USER_INPUT',
        type: WRONG_PASSWORD_FORMAT,
        message: 'Password must be in string format',
        messageForUser: 'api.user.WRONG_PASSWORD_FORMAT',
    },
    INVALID_EXTERNAL_PHONE: {
        variable: ['data', 'externalPhone'],
        code: 'BAD_USER_INPUT',
        type: INVALID_EXTERNAL_PHONE,
        message: 'Invalid external phone provided',
    },
    INVALID_EXTERNAL_EMAIL: {
        variable: ['data', 'externalEmail'],
        code: 'BAD_USER_INPUT',
        type: INVALID_EXTERNAL_EMAIL,
        message: 'Invalid external email provided',
    },
    INVALID_EXTERNAL_SYSTEM_NAME: {
        variable: ['data', 'externalSystemName'],
        code: 'BAD_USER_INPUT',
        type: INVALID_EXTERNAL_SYSTEM,
        message: 'Invalid external system name provided',
    },
    INVALID_PASSWORD_LENGTH: {
        variable: ['data', 'password'],
        code: 'BAD_USER_INPUT',
        type: INVALID_PASSWORD_LENGTH,
        message: 'Password length must be between {min} and {max} characters',
        messageForUser: 'api.user.INVALID_PASSWORD_LENGTH',
        messageInterpolation: {
            min: MIN_PASSWORD_LENGTH,
            max: MAX_PASSWORD_LENGTH,
        },
    },
    PASSWORD_CONTAINS_EMAIL: {
        variable: ['data', 'password'],
        code: 'BAD_USER_INPUT',
        type: PASSWORD_CONTAINS_EMAIL,
        message: 'Password must not contain email',
        messageForUser: 'api.user.PASSWORD_CONTAINS_EMAIL',
    },
    PASSWORD_CONTAINS_PHONE: {
        variable: ['data', 'password'],
        code: 'BAD_USER_INPUT',
        type: PASSWORD_CONTAINS_PHONE,
        message: 'Password must not contain phone',
        messageForUser: 'api.user.PASSWORD_CONTAINS_PHONE',
    },
    PASSWORD_IS_FREQUENTLY_USED: {
        variable: ['data', 'password'],
        code: 'BAD_USER_INPUT',
        type: PASSWORD_IS_FREQUENTLY_USED,
        message: 'The password is too simple. We found it in the list of stolen passwords. You need to use something more secure',
        messageForUser: 'api.user.PASSWORD_IS_FREQUENTLY_USED',
    },
    PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS: {
        variable: ['data', 'password'],
        code: 'BAD_USER_INPUT',
        type: PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
        message: 'Password must contain at least {min} different characters',
        messageForUser: 'api.user.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS',
        messageInterpolation: {
            min: MIN_COUNT_OF_DIFFERENT_CHARACTERS_IN_PASSWORD,
        },
    },
}

/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const ERRORS = {
    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION: {
        mutation: 'registerNewUser',
        variable: ['data', 'confirmPhoneActionToken'],
        code: 'BAD_USER_INPUT',
        type: UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
        message: 'Unable to find confirm phone action',
        messageForUser: 'api.user.registerNewUser.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION',
    },
    WRONG_PHONE_FORMAT: {
        mutation: 'registerNewUser',
        variable: ['data', 'phone'],
        code: 'BAD_USER_INPUT',
        type: WRONG_PHONE_FORMAT,
        message: 'Wrong format of provided phone number',
        messageForUser: 'api.common.WRONG_PHONE_FORMAT',
        correctExample: '+79991234567',
    },
    NO_CONFIRM_PHONE_ACTION_TOKEN: {
        mutation: 'registerNewUser',
        variable: ['data', 'confirmPhoneActionToken'],
        code: 'BAD_USER_INPUT',
        type: NO_CONFIRM_PHONE_ACTION_TOKEN,
        message: '"confirmPhoneActionToken" cannot be empty',
        messageForUser: 'api.user.registerNewUser.NO_CONFIRM_PHONE_ACTION_TOKEN',
    },
    ...pick(GQL_ERRORS, [
        'INVALID_PASSWORD_LENGTH',
        'PASSWORD_CONTAINS_EMAIL',
        'PASSWORD_CONTAINS_PHONE',
        'PASSWORD_IS_FREQUENTLY_USED',
        'PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS',
    ]),
    USER_WITH_SPECIFIED_PHONE_ALREADY_EXISTS: {
        mutation: 'registerNewUser',
        variable: ['data', 'phone'],
        code: 'BAD_USER_INPUT',
        type: NOT_UNIQUE,
        message: 'User with specified phone already exists',
        messageForUser: 'api.user.registerNewUser.USER_WITH_SPECIFIED_PHONE_ALREADY_EXISTS',
    },
    USER_WITH_SPECIFIED_EMAIL_ALREADY_EXISTS: {
        mutation: 'registerNewUser',
        variable: ['data', 'email'],
        code: 'BAD_USER_INPUT',
        type: NOT_UNIQUE,
        message: 'User with specified email already exists',
        messageForUser: 'api.user.registerNewUser.USER_WITH_SPECIFIED_EMAIL_ALREADY_EXISTS',
    },
    UNABLE_TO_CREATE_USER: {
        mutation: 'registerNewUser',
        code: 'INTERNAL_ERROR',
        type: UNABLE_TO_CREATE_USER,
        message: 'Unable to create user',
        messageForUser: 'api.user.registerNewUser.UNABLE_TO_CREATE_USER',
    },
    WRONG_USER_TYPE: {
        mutation: 'createUserExternalIdentity',
        variable: ['data', 'userType'],
        code: 'BAD_USER_INPUT',
        type: USER_EXTERNAL_IDENTITY_WRONG_USER_TYPE,
        message: 'UserType must be same as user.type',
    },
    WRONG_USER_EXTERNAL_IDENTITY_TYPE: {
        variable: ['data', 'identityType'],
        code: 'BAD_USER_INPUT',
        type: USER_EXTERNAL_IDENTITY_WRONG_IDENTITY_TYPE,
        message: 'IdentityType has unsupported value',
    },
}

module.exports = {
    ERRORS,
    WRONG_PASSWORD_ERROR,
    EMPTY_PASSWORD_ERROR,
    WRONG_EMAIL_ERROR,
    MULTIPLE_ACCOUNTS_MATCHES,
    WRONG_PHONE_ERROR,
    PASSWORD_TOO_SHORT,
    AUTH_BY_PASSWORD_FAILED_ERROR,
    EMAIL_ALREADY_REGISTERED_ERROR,
    PHONE_ALREADY_REGISTERED_ERROR,
    EMAIL_WRONG_FORMAT_ERROR,
    PHONE_WRONG_FORMAT_ERROR,
    PHONE_IS_REQUIRED_ERROR,
    TOKEN_NOT_FOUND,
    USER_NOT_FOUND,
    DENIED_FOR_ADMIN,
    DENIED_FOR_SUPPORT,
    WRONG_CREDENTIALS,
    UNABLE_TO_CREATE_CONTACT_DUPLICATE,
    UNABLE_TO_UPDATE_CONTACT_DUPLICATE,
    UNABLE_TO_CREATE_USER,
    TOKEN_EXPIRED_ERROR,
    MIN_PASSWORD_LENGTH_ERROR,
    PASSWORD_IS_FREQUENTLY_USED_ERROR,
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    SMS_CODE_EXPIRED,
    EMAIL_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    SMS_CODE_VERIFICATION_FAILED,
    EMAIL_CODE_VERIFICATION_FAILED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    SMS_CODE_MAX_RETRIES_REACHED,
    TOO_MANY_REQUESTS,
    CAPTCHA_CHECK_FAILED,
    SMS_FOR_IP_DAY_LIMIT_REACHED,
    SMS_FOR_PHONE_DAY_LIMIT_REACHED,
    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
    UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
    CANNOT_RESET_ADMIN_USER,
    EMPTY_EXTERNAL_IDENTITY_ID_VALUE,
    GQL_ERRORS,
    WRONG_PASSWORD_FORMAT,
    INVALID_PASSWORD_LENGTH,
    PASSWORD_CONTAINS_EMAIL,
    PASSWORD_CONTAINS_PHONE,
    GENERATE_TOKEN_FAILED,
    INVALID_TOKEN,
    UNSUPPORTED_TOKEN,
    CREDENTIAL_VALIDATION_FAILED,
    USER_IDENTITY_INVALID,
    REQUEST_LIMIT_ERRORS,
    EMAIL_CODE_MAX_RETRIES_REACHED,
    NOT_ENOUGH_AUTH_FACTORS,
}
