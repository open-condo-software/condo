// https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/handling_notification_responses_from_apns/
const UNKNOWN_STATUS = 'unknown'
const ERRORS = {
    400: 'Bad request',
    403: 'There was an error with the certificate or with the provider’s authentication token.',
    404: 'The request contained an invalid :path value.',
    405: 'The request used an invalid :method value. Only POST requests are supported.',
    410: 'The device token is no longer active for the topic.',
    413: 'The notification payload was too large.',
    429: 'The server received too many requests for the same device token.',
    500: 'Internal server error.',
    503: 'The server is shutting down and unavailable.',
}

// https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
const APS_PUSH_TYPE_ALERT = 'alert'
const APS_PUSH_TYPE_VOIP = 'voip'
const APS_PUSH_TYPE_BACKGROUND = 'background'
const APS_RESPONSE_STATUS_SUCCESS = 200

module.exports = {
    UNKNOWN_STATUS,
    ERRORS,
    APS_PUSH_TYPE_ALERT,
    APS_PUSH_TYPE_VOIP,
    APS_PUSH_TYPE_BACKGROUND,
    APS_RESPONSE_STATUS_SUCCESS,
}