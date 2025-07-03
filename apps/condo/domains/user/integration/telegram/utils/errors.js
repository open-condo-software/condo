const ERRORS = {
    VALIDATION_AUTH_DATA_KEYS_MISMATCH: {
        type: 'VALIDATION_AUTH_DATA_KEYS_MISMATCH',
        status: 400,
        message: 'Tg auth data has invalid keys',
    },
    VALIDATION_AUTH_DATA_EXPIRED: {
        type: 'VALIDATION_AUTH_DATA_EXPIRED',
        status: 400,
        message: 'Tg auth date is too far in past',
    },
    VALIDATION_AUTH_DATA_SIGN_INVALID: {
        type: 'VALIDATION_AUTH_DATA_SIGN_INVALID',
        status: 400,
        message: 'Tg auth data sign is invalid',
    },
    NOT_SUPPORTED_USER_TYPE: {
        type: 'NOT_SUPPORTED_USER_TYPE',
        status: 400,
        message: 'This user type is not supported for bot',
    },
    TG_AUTH_DATA_MISSING: {
        type: 'TG_AUTH_DATA_MISSING',
        status: 400,
        message: 'Search parameter "tgAuthData" is empty',
    },
    INVALID_REDIRECT_URL: {
        type: 'INVALID_REDIRECT_URL',
        status: 400,
        message: 'This redirect url is not supported for bot',
    },
    SUPER_USERS_NOT_ALLOWED: {
        type: 'SUPER_USERS_NOT_ALLOWED',
        status: 400,
        message: 'You can\'t authorize super users with this bot',
    },
    ACCESS_DENIED: {
        type: 'ACCESS_DENIED',
        status: 400,
        message: 'Your user is invalid',
    },
    USER_IS_NOT_REGISTERED: {
        type: 'USER_IS_NOT_REGISTERED',
        status: 401,
        message: 'You have to login or register user first',
    },
    INVALID_BOT_ID: {
        type: 'INVALID_BOT_ID',
        status: 400,
        message: 'You trying to log in via unsupported bot',
    },
    INVALID_NONCE: {
        type: 'INVALID_NONCE',
        status: 400,
        message: 'You should pass "nonce" in search parameters',
    },
    INVALID_STATE: {
        type: 'INVALID_STATE',
        status: 400,
        message: 'You should pass "state" in search parameters',
    },
    INVALID_CONFIG: {
        type: 'INVALID_CONFIG',
        status: 500,
        message: 'env "TELEGRAM_OAUTH_CONFIG" is invalid',
    },
}

class TelegramOauthError extends Error {
    constructor (error) {
        super(error.message)
        Object.assign(this, error)
        Error.captureStackTrace(this, this.constructor)
    }

    toJSON () {
        return Object.assign({ message: this.message }, this)
    }
}

module.exports = {
    ERRORS,
    TelegramOauthError,
}