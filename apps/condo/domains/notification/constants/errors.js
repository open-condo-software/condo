const { FIREBASE_CONFIG_ENV } = require('./constants')

const EMPTY_CONFIG_ERROR = `Valid ${FIREBASE_CONFIG_ENV} should be provided within .helm (.env), and can be retrieved from https://console.firebase.google.com/project/__PROJECT_ID__/settings/serviceaccounts/adminsdk`
const EMPTY_NOTIFICATION_TITLE_BODY_ERROR = 'Missing notification.title or notification.body'
const MESSAGE_TYPE_IN_USER_BLACK_LIST = 'Notification not delivered because user, phone, or email of message added in MessageUserBlackList'
const MESSAGE_TYPE_IN_ORGANIZATION_BLACK_LIST = 'Notification not delivered because organization of message added in MessageOrganizationBlackList'

module.exports = {
    EMPTY_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
    MESSAGE_TYPE_IN_USER_BLACK_LIST,
    MESSAGE_TYPE_IN_ORGANIZATION_BLACK_LIST,
}