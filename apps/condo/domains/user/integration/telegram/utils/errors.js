const { GQLErrorCode: { BAD_USER_INPUT, FORBIDDEN, INTERNAL_ERROR, UNAUTHENTICATED, PAYLOAD_TOO_LARGE, TOO_MANY_REQUESTS } } = require('@open-condo/keystone/errors')

const HTTP_STATUS_BY_CODE = {
    [INTERNAL_ERROR]: 500,
    [UNAUTHENTICATED]: 401,
    [FORBIDDEN]: 403,
    [BAD_USER_INPUT]: 400,
    [TOO_MANY_REQUESTS]: 429,
    [PAYLOAD_TOO_LARGE]: 413,
}

const ERRORS = {
    VALIDATION_AUTH_DATA_KEYS_MISMATCH: {
        type: 'VALIDATION_AUTH_DATA_KEYS_MISMATCH',
        code: BAD_USER_INPUT,
        message: 'tg auth data has invalid keys',
    },
    VALIDATION_AUTH_DATA_EXPIRED: {
        type: 'VALIDATION_AUTH_DATA_EXPIRED',
        code: BAD_USER_INPUT,
        message: 'tg auth date is too far in past',
    },
    VALIDATION_AUTH_DATA_SIGN_INVALID: {
        type: 'VALIDATION_AUTH_DATA_SIGN_INVALID',
        code: BAD_USER_INPUT,
        message: 'tg auth data sign is invalid',
    },
    NOT_SUPPORTED_USER_TYPE: {
        type: 'NOT_SUPPORTED_USER_TYPE',
        code: BAD_USER_INPUT,
        message: 'this user type is not supported for bot',
    },
    TG_AUTH_DATA_MISSING: {
        type: 'TG_AUTH_DATA_MISSING',
        code: BAD_USER_INPUT,
        message: 'search parameter "tgAuthData" is empty',
    },
    INVALID_REDIRECT_URL: {
        type: 'INVALID_REDIRECT_URL',
        code: BAD_USER_INPUT,
        message: 'this redirect url is not supported for bot',
    },
    SUPER_USERS_NOT_ALLOWED: {
        type: 'SUPER_USERS_NOT_ALLOWED',
        code: FORBIDDEN,
        message: 'you can\'t authorize super users with this bot',
    },
    ACCESS_DENIED: {
        type: 'ACCESS_DENIED',
        code: FORBIDDEN,
        message: 'your user is invalid',
    },
    USER_IS_NOT_REGISTERED: {
        type: 'USER_IS_NOT_REGISTERED',
        code: UNAUTHENTICATED,
        message: 'you have to login or register user first',
    },
    INVALID_BOT_ID: {
        type: 'INVALID_BOT_ID',
        code: BAD_USER_INPUT,
        message: 'you trying to log in via unsupported bot',
    },
    INVALID_CONFIG: {
        type: 'INVALID_CONFIG',
        code: INTERNAL_ERROR,
        message: 'env "TELEGRAM_OAUTH_CONFIG" is invalid',
    },
}

class HttpError extends Error {
    constructor (error) {
        super(error.message)
        Object.assign(this, error)
        this.statusCode = HTTP_STATUS_BY_CODE[this.code || BAD_USER_INPUT]
        Error.captureStackTrace(this, this.constructor)
    }

    toJSON () {
        return Object.assign({ message: this.message }, this)
    }
}

module.exports = {
    ERRORS,
    HttpError,
}