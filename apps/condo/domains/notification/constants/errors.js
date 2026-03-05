const { FIREBASE_CONFIG_ENV, HCM_CONFIG_ENV, APPLE_CONFIG_ENV, WEBHOOK_CONFIG_ENV, ONESIGNAL_CONFIG_ENV } = require('@condo/domains/notification/constants/constants')

const EMPTY_FIREBASE_CONFIG_ERROR = `Valid ${FIREBASE_CONFIG_ENV} should be provided within .helm (.env), and can be retrieved from https://console.firebase.google.com/project/__PROJECT_ID__/settings/serviceaccounts/adminsdk`
const EMPTY_HCM_CONFIG_ERROR = `Valid ${HCM_CONFIG_ENV} should be provided within .helm (.env), and can be retrieved from ...`
const EMPTY_APPLE_CONFIG_ERROR = `Valid ${APPLE_CONFIG_ENV} should be provided within .helm (.env), and should contain "kid": String(10), "iss": String(10), "privateKey": String(200?)`
const EMPTY_WEBHOOK_CONFIG_ERROR = `Valid ${WEBHOOK_CONFIG_ENV} should be provided within .env`
const HCM_UNSUPPORTED_APP_ID_ERROR = 'Unsupported appId provided via RemoteClient'
const INVALID_HCM_CONFIG_ERROR = 'Structure of provided HCM config is invalid'
const EMPTY_NOTIFICATION_TITLE_BODY_ERROR = 'Missing notification.title or notification.body'
const MESSAGE_TYPE_IN_USER_BLACK_LIST = 'Notification not delivered because user, phone, or email of message added in MessageUserBlackList'
const MESSAGE_TYPE_IN_ORGANIZATION_BLACK_LIST = 'Notification not delivered because organization of message added in MessageOrganizationBlackList'
const EMPTY_MESSAGE_USER_BLACK_LIST_FIELDS_ERROR = 'One of the "user", "phone" or "email" fields should be provided'
const WRONG_MESSAGE_TYPE_PROVIDED_ERROR = 'Wrong messageType provided: ${messageType}'
const MESSAGE_DISABLED_BY_USER = 'Notification not delivered because user disabled it'
const ONE_MESSAGE_PER_THROTTLING_PERIOD_FOR_USER = '1 message per %s sec for user. The latest message was at %s'
const NO_TELEGRAM_CHAT_FOR_USER = 'No telegram chat for user id'
const NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION = 'No userId to send telegram notification'
const EMPTY_ONESIGNAL_CONFIG_ERROR = `Valid ${ONESIGNAL_CONFIG_ENV} should be provided within .helm (.env)`

const TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED = 'TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED'
const PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY = 'PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY'
const TOO_MANY_TOKENS_FOR_TRANSPORT = 'TOO_MANY_TOKENS_FOR_TRANSPORT'
const DYNAMIC_DEVICE_KEY_VALIDATION_ERROR = 'DYNAMIC_DEVICE_KEY_VALIDATION_ERROR'
const WRONG_DEVICE_KEY_FORMAT = 'WRONG_DEVICE_KEY_FORMAT'
const INVALID_DEVICE_KEY_LENGTH = 'INVALID_DEVICE_KEY_LENGTH'
const DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS = 'DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS'

//api errors
const NO_NEED_TO_ENABLE_NOTIFICATIONS = 'NO_NEED_TO_ENABLE_NOTIFICATIONS'
const EMPTY_NOTIFICATION_ANONYMOUS_SETTING_FIELDS_ERROR = 'One of the "phone" or "email" fields should be provided'

module.exports = {
    EMPTY_FIREBASE_CONFIG_ERROR,
    EMPTY_HCM_CONFIG_ERROR,
    EMPTY_APPLE_CONFIG_ERROR,
    EMPTY_WEBHOOK_CONFIG_ERROR,
    HCM_UNSUPPORTED_APP_ID_ERROR,
    INVALID_HCM_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
    MESSAGE_TYPE_IN_USER_BLACK_LIST,
    MESSAGE_TYPE_IN_ORGANIZATION_BLACK_LIST,
    EMPTY_MESSAGE_USER_BLACK_LIST_FIELDS_ERROR,
    WRONG_MESSAGE_TYPE_PROVIDED_ERROR,
    NO_NEED_TO_ENABLE_NOTIFICATIONS,
    MESSAGE_DISABLED_BY_USER,
    ONE_MESSAGE_PER_THROTTLING_PERIOD_FOR_USER,
    NO_TELEGRAM_CHAT_FOR_USER,
    NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION,
    EMPTY_NOTIFICATION_ANONYMOUS_SETTING_FIELDS_ERROR,
    EMPTY_ONESIGNAL_CONFIG_ERROR,

    TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED,
    PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY,
    TOO_MANY_TOKENS_FOR_TRANSPORT,
    DYNAMIC_DEVICE_KEY_VALIDATION_ERROR,
    WRONG_DEVICE_KEY_FORMAT,
    INVALID_DEVICE_KEY_LENGTH,
    DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
}
