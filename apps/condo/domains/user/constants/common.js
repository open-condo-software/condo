const MIN_PASSWORD_LENGTH = 8
const LOCK_TIMEOUT = 1
const SMS_CODE_LENGTH = 4
const SMS_CODE_TTL = 60 // seconds
const CONFIRM_PHONE_ACTION_EXPIRY = 3600 // 1 hour
const CONFIRM_PHONE_SMS_MAX_RETRIES = 10
const SAFE_CAPTCHA_SCORE = 0.5
const TROW_ERRORS_ON_LOW_CAPTCHA_SCORE = false
const MAX_SMS_FOR_IP_BY_DAY = 100
const MAX_SMS_FOR_PHONE_BY_DAY = 20

// Value of `User.type`, that indicates, that this user is a resident (from mobile client).
const RESIDENT = 'resident'
const STAFF = 'staff'
const SERVICE = 'service'
const USER_TYPES = [STAFF, RESIDENT, SERVICE]

module.exports = {
    MIN_PASSWORD_LENGTH,
    LOCK_TIMEOUT,
    SMS_CODE_LENGTH,
    SMS_CODE_TTL,
    CONFIRM_PHONE_ACTION_EXPIRY,
    CONFIRM_PHONE_SMS_MAX_RETRIES,
    SAFE_CAPTCHA_SCORE,
    TROW_ERRORS_ON_LOW_CAPTCHA_SCORE,
    MAX_SMS_FOR_IP_BY_DAY,
    MAX_SMS_FOR_PHONE_BY_DAY,
    RESIDENT,
    STAFF,
    SERVICE,
    USER_TYPES,
}
