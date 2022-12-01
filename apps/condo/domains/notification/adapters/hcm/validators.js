const { isString, isEmpty, get } = require('lodash')

const {
    URGENCY_HIGH, URGENCY_NORMAL,
    IMPORTANCE_HIGH, IMPORTANCE_NORMAL, IMPORTANCE_LOW,
    DIR_AUTO, DIR_LTR, DIR_RTL,
    WEB_URGENCY_HIGH, WEB_URGENCY_NORMAL, WEB_URGENCY_LOW, WEB_URGENCY_VERY_LOW,
    STYLE_BIG_TEXT, STYLE_BIG_PICTURE,
    CLICK_ACTION_TYPE_INTENT, CLICK_ACTION_TYPE_URL, CLICK_ACTION_TYPE_APP, CLICK_ACTION_TYPE_RICH_RESOURCE,
    PATTERN, COLOR_PATTERN, TTL_INIT,
} = require('./constants')

function isNonEmptyString (s) {
    return isString(s) && s.trim().length > 0
}

function validateMessage (message) {
    if (isEmpty(message)) throw new Error('message must not be null or empty!')

    validateFieldTarget(message.token, message.topic, message.condition)

    if (message.webpush) validateWebPushConfig(message.webpush, message.notification)

    return validateAndroidConfig(message.android, message.notification)
}

function validateFieldTarget (token, ...params) {
    let count = 0

    if (token) count++
    if (!isEmpty(params))
        params.forEach(pa => {
            if (isNonEmptyString(pa)) count++
        })

    if (count === 1) return

    throw new Error('token, topic or condition must be choice one')
}

function validateWebPushConfig (webPushConfig, notification){

    if (!isNonEmptyString(webPushConfig.notification.title) && !isNonEmptyString(notification.title))
        throw new Error('title must not be empty')

    if (!isNonEmptyString(webPushConfig.notification.body) && !isNonEmptyString(notification.body))
        throw new Error('body must not be empty')

    if (isNonEmptyString(webPushConfig.notification.dir) &&
        (
            webPushConfig.notification.dir !== DIR_AUTO &&
            webPushConfig.notification.dir !== DIR_LTR &&
            webPushConfig.notification.dir !== DIR_RTL
        )
    )
        throw new Error(`dir must be '${DIR_AUTO}', '${DIR_LTR}' or '${DIR_RTL}'`)

    if (isNonEmptyString(webPushConfig.headers.urgency) &&
        (
            webPushConfig.headers.urgency !== WEB_URGENCY_HIGH &&
            webPushConfig.headers.urgency !== WEB_URGENCY_NORMAL &&
            webPushConfig.headers.urgency !== WEB_URGENCY_LOW &&
            webPushConfig.headers.urgency !== WEB_URGENCY_VERY_LOW
        )
    )
        throw new Error(`urgency must be '${WEB_URGENCY_HIGH}', '${WEB_URGENCY_NORMAL}' , '${WEB_URGENCY_LOW}' or '${WEB_URGENCY_VERY_LOW}'`)
}

function validateAndroidConfig (androidConfig, notification) {
    if (isEmpty(androidConfig)) return

    if (androidConfig.collapse_key < -1 || androidConfig.collapse_key > 100)
        throw new Error('collapse_key must be in interval [-1 - 100]')

    if (
        isNonEmptyString(androidConfig.urgency) &&
        androidConfig.urgency !== URGENCY_HIGH &&
        androidConfig.urgency !== URGENCY_NORMAL
    )
        throw new Error(`priority must be '${URGENCY_HIGH}' or '${URGENCY_NORMAL}'`)

    if (isNonEmptyString(androidConfig.ttl) && !PATTERN.exec(androidConfig.ttl))
        throw new Error('Wrong input format for ttl')

    if (!androidConfig.ttl) androidConfig.ttl = TTL_INIT
    if (!androidConfig.fast_app_target) androidConfig.fast_app_target = 2

    return validateAndroidNotification(androidConfig.notification, notification)
}

function validateAndroidNotification (androidNotification, notification) {
    if (isEmpty(notification)) return

    if (!isNonEmptyString(get(androidNotification, 'title')) && !isNonEmptyString(get(notification, 'title')))
        throw new Error('title must not be empty')

    if (!isNonEmptyString(get(androidNotification, 'body')) && !isNonEmptyString(get(notification, 'body')))
        throw new Error('body must not be empty')

    switch (get(androidNotification, 'style')) {
        case STYLE_BIG_TEXT:
            if (!isNonEmptyString(get(androidNotification, 'big_title')))
                throw new Error(`big_title must not be empty when style is ${STYLE_BIG_TEXT}`)

            if (!isNonEmptyString(get(androidNotification, 'big_body')))
                throw new Error(`big_body must not be empty when style is ${STYLE_BIG_TEXT}`)

            break

        case STYLE_BIG_PICTURE:
            if (!isNonEmptyString(get(androidNotification, 'big_picture')))
                throw new Error(`big_picture must not be empty when style is ${STYLE_BIG_PICTURE}`)
    }

    if (get(androidNotification, 'color') && !COLOR_PATTERN.exec(get(androidNotification, 'color')))
        throw new Error('color must be in the form #RRGGBB')


    if (isNonEmptyString(get(androidNotification, 'group')) && isNonEmptyString(get(androidNotification, 'notify_id')))
        throw new Error('notify_id must be empty when group exist')


    const importance = get(androidNotification, 'importance')
    if (
        isNonEmptyString(importance) &&
        importance !== IMPORTANCE_HIGH &&
        importance !== IMPORTANCE_NORMAL &&
        importance !== IMPORTANCE_LOW
    )
        throw new Error(`importance must be '${IMPORTANCE_LOW}', '${IMPORTANCE_NORMAL}' or '${IMPORTANCE_HIGH}'`)

    validateClickAction(get(androidNotification, 'click_action'))

    return validateLightSetting(get(androidNotification, 'light_settings'))
}

function validateClickAction (clickAction) {
    if (isEmpty(clickAction)) throw new Error('click_action object must not be nullish or empty')

    switch (get(clickAction, 'type')) {
        case CLICK_ACTION_TYPE_INTENT:
            if (!isNonEmptyString(get(clickAction, 'intent')) && !isNonEmptyString(get(clickAction, 'action')))
                throw new Error(`intent and action have at least one when type is ${CLICK_ACTION_TYPE_INTENT}`)

            break

        case CLICK_ACTION_TYPE_URL:
            if (!isNonEmptyString(get(clickAction, 'url')))
                throw new Error(`url must not be empty when type is ${CLICK_ACTION_TYPE_URL}`)

            break

        case CLICK_ACTION_TYPE_APP:
            break

        case CLICK_ACTION_TYPE_RICH_RESOURCE:
            if (!isNonEmptyString(get(clickAction, 'rich_resource')))
                throw new Error(`rich_resource must not be empty when type is ${CLICK_ACTION_TYPE_RICH_RESOURCE}`)

            break

        default:
            throw new Error(`type must be in the interval [${CLICK_ACTION_TYPE_INTENT} - ${CLICK_ACTION_TYPE_RICH_RESOURCE}]`)
    }
}

function validateLightSetting (lightSettings) {
    if (isEmpty(lightSettings)) return

    if (!get(lightSettings, 'color'))
        throw new Error('lightSettings.color must not be empty')

    const lightOffDuration = get(lightSettings, 'light_off_duration')
    if (isNonEmptyString(lightOffDuration) && !PATTERN.exec(lightOffDuration))
        throw new Error('Wrong input format for lightSettings.light_off_duration')

    const lightOnDuration = get(lightSettings, 'light_on_duration')
    if (isNonEmptyString(lightOnDuration) && !PATTERN.exec(lightOnDuration))
        throw new Error('Wrong input format for lightSettings.light_on_duration')
}

module.exports = {
    validateMessage,
    validateFieldTarget,
    validateWebPushConfig,
    validateAndroidConfig,
    validateAndroidNotification,
    validateLightSetting,
}