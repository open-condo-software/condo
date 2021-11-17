const WRONG_PASSWORD_ERROR = '[passwordAuth:secret:mismatch'
const EMPTY_PASSWORD_ERROR = '[passwordAuth:secret:notSet'
const WRONG_EMAIL_ERROR = '[passwordAuth:identity:notFound'
const WRONG_PHONE_ERROR = '[passwordAuth:identity:notFound'
const AUTH_BY_PASSWORD_FAILED_ERROR = '[passwordAuth:failure'

const MULTIPLE_ACCOUNTS_MATCHES = '[resetPassword:identity:multipleFound'
const RESET_TOKEN_NOT_FOUND = '[resetPassword:token:notFound'
const TOKEN_EXPIRED_ERROR = '[resetPassword:token:expired'

const MIN_PASSWORD_LENGTH_ERROR = '[register:password:minLength'
const PASSWORD_TOO_SHORT = '[password:min:length'

const EMAIL_ALREADY_REGISTERED_ERROR = '[unique:email:multipleFound'
const PHONE_ALREADY_REGISTERED_ERROR = '[unique:phone:multipleFound'

const EMAIL_WRONG_FORMAT_ERROR = '[format:email'
const PHONE_WRONG_FORMAT_ERROR = '[format:phone'

const CONFIRM_PHONE_ACTION_EXPIRED = '[confirm:phone:expired'
const CONFIRM_PHONE_SMS_CODE_EXPIRED = '[confirm:phone:smscode:expired'
const CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED = '[confirm:phone:smscode:verify:failed'
const CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED = '[confirm:phone:smscode:tooManyRequests'
const TOO_MANY_REQUESTS = '[security:tooManyRequests'
const CAPTCHA_CHECK_FAILED = '[security:captcha:failed'
const SMS_FOR_IP_DAY_LIMIT_REACHED = '[security:sms:for:ip:day:limit'
const SMS_FOR_PHONE_DAY_LIMIT_REACHED = '[security:sms:for:phone:day:limit'

const SIGNIN_AS_USER_NOT_FOUND = '[signin:as:user:not:found'
const SIGNIN_AS_USER_DENIED = '[signin:as:user:denied'

module.exports = {
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
    RESET_TOKEN_NOT_FOUND,
    TOKEN_EXPIRED_ERROR,
    MIN_PASSWORD_LENGTH_ERROR,
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    TOO_MANY_REQUESTS,
    CAPTCHA_CHECK_FAILED,
    SMS_FOR_IP_DAY_LIMIT_REACHED,
    SMS_FOR_PHONE_DAY_LIMIT_REACHED,
    SIGNIN_AS_USER_NOT_FOUND,
    SIGNIN_AS_USER_DENIED,
}
