
const WRONG_PASSWORD_ERROR = '[passwordAuth:secret:mismatch'
const EMPTY_PASSWORD_ERROR = '[passwordAuth:secret:notSet'
const WRONG_EMAIL_ERROR = '[passwordAuth:identity:notFound'
const MULTIPLE_ACCOUNTS_MATCHES = '[resetPassword:identity:multipleFound'
const WRONG_PHONE_ERROR = '[passwordAuth:identity:notFound'
const AUTH_BY_PASSWORD_FAILED_ERROR = '[passwordAuth:failure'
const MIN_PASSWORD_LENGTH_ERROR = '[register:password:minLength'
const RESET_TOKEN_NOT_FOUND = '[resetPassword:token:notFound'
const PASSWORD_TOO_SHORT = '[password:min:length'


const EMAIL_ALREADY_REGISTERED_ERROR = '[unique:email:multipleFound'
const PHONE_ALREADY_REGISTERED_ERROR = '[unique:phone:multipleFound'

const CONFIRM_PHONE_ACTION_EXPIRED = '[confirm:phone:experied' 
const CONFIRM_PHONE_SMS_CODE_EXPIRED = '[confirm:phone:smscode:expired'
const CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED = '[confirm:phone:smscode:verify:failed'
const CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED = '[confirm:phone:smscode:tooManyRequests'


module.exports = {
    WRONG_PASSWORD_ERROR,
    EMPTY_PASSWORD_ERROR,
    WRONG_EMAIL_ERROR,
    PHONE_ALREADY_REGISTERED_ERROR,
    MULTIPLE_ACCOUNTS_MATCHES,
    WRONG_PHONE_ERROR,
    PASSWORD_TOO_SHORT,
    AUTH_BY_PASSWORD_FAILED_ERROR,
    EMAIL_ALREADY_REGISTERED_ERROR,
    RESET_TOKEN_NOT_FOUND,
    MIN_PASSWORD_LENGTH_ERROR,
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
}
