const { FIREBASE_CONFIG_ENV } = require('./constants')

const EMPTY_CONFIG_ERROR = `Valid ${FIREBASE_CONFIG_ENV} should be provided within .helm (.env), and can be retrieved from https://console.firebase.google.com/project/__PROJECT_ID__/settings/serviceaccounts/adminsdk`
const EMPTY_NOTIFICATION_TITLE_BODY_ERROR = 'Missing notification.title or notification.body'

module.exports = {
    EMPTY_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
}