// Value of `User.type`, that indicates, that this user is a resident (from mobile client).
const RESIDENT = 'resident'
const STAFF = 'staff'
const SERVICE = 'service'
const USER_TYPES = [STAFF, RESIDENT, SERVICE]

const APPLE_ID_IDP_TYPE = 'apple_id'
const SBER_ID_IDP_TYPE = 'sber_id'
const SBBOL_IDP_TYPE = 'sbbol'
const IDP_TYPES = [APPLE_ID_IDP_TYPE, SBER_ID_IDP_TYPE, SBBOL_IDP_TYPE]

const MIN_PASSWORD_LENGTH = 8
const LOCK_TIMEOUT = 1
const SMS_CODE_LENGTH = 4
const SMS_CODE_TTL = 60 // seconds
const CONFIRM_PHONE_ACTION_EXPIRY = 3600 // 1 hour
const CONFIRM_PHONE_SMS_MAX_RETRIES = 10
const MAX_SMS_FOR_IP_BY_DAY = 100
const MAX_SMS_FOR_PHONE_BY_DAY = 20

const SBER_ID_SESSION_KEY = 'sberid'
const APPLE_ID_SESSION_KEY = 'appleid'

const LOCALE_RU = 'ru'
const LOCALE_EN = 'en'
const LOCALES = [LOCALE_RU, LOCALE_EN]

module.exports = {
    MIN_PASSWORD_LENGTH,
    LOCK_TIMEOUT,
    SMS_CODE_LENGTH,
    SMS_CODE_TTL,
    CONFIRM_PHONE_ACTION_EXPIRY,
    CONFIRM_PHONE_SMS_MAX_RETRIES,
    MAX_SMS_FOR_IP_BY_DAY,
    MAX_SMS_FOR_PHONE_BY_DAY,
    RESIDENT,
    STAFF,
    SERVICE,
    USER_TYPES,
    APPLE_ID_IDP_TYPE,
    SBER_ID_IDP_TYPE,
    SBBOL_IDP_TYPE,
    IDP_TYPES,
    SBER_ID_SESSION_KEY,
    APPLE_ID_SESSION_KEY,
    LOCALES,
}
