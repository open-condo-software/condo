const { isEmpty, isNull, isNil, get, isObject } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { RedStoreNotificationSender } = require('@condo/domains/notification/adapters/redStore/redStoreNotificationSender')
const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    REDSTORE_CONFIG_ENV,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV,
} = require('@condo/domains/notification/constants/constants')
const { getEmptyResult, getFakeSuccessResponse, getFakeErrorResponse } = require('@condo/domains/notification/utils/testSchema/utils')

const REDSTORE_CONFIG = conf[REDSTORE_CONFIG_ENV] ? JSON.parse(conf[REDSTORE_CONFIG_ENV]) : null
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []
const DEFAULT_PUSH_SETTINGS = {}

const logger = getLogger('redStoreAdapter')

/**
 * Firebase rejects push if any of data fields is not a string, so we should convert all non-string fields to strings
 * @param data
 */
function prepareData (data = {}, token) {
    const result = { token }

    for (const key in data) {
        if (data.hasOwnProperty(key)) result[key] = String(data[key])
    }

    return result
}
/**
 * Send push notification to pushToken via app, configured by REDSTORE_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class RedStoreAdapter {
    projectId = null
    #config = null

    constructor (config = REDSTORE_CONFIG) {
        this.projectId = get(config, 'project_id', null)
        try {
            if (isEmpty(config)) throw new Error(`Valid ${REDSTORE_CONFIG_ENV} should be provided within .helm (.env)`)
            if (isNil(this.projectId)) throw new Error('Provided projectId is null or undefined')
            if (isNil(config.url)) throw new Error('Provided url is null or undefined')
        } catch (err) {
            // For CI/local tests config is useless because of emulation via FAKE tokens
            logger.error({ msg: 'redStore adapter error', err })
        }

        this.#config = config
        // not user input. No ReDoS regexp expected
        // nosemreg: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        this.messageIdPrefixRegexp = new RegExp(`projects/${this.projectId}/messages`)
    }

    /**
     * Validates and prepares notification significant fields
     * @param title
     * @param body
     * @returns {{title, body}}
     */
    static validateAndPrepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error('Missing notification.title or notification.body')
        const image = 'CondoImage' // надо сюды вставить урл на иконку домов, чтобы не приходило голое уведомление

        return { title, body, image }
    }

    /**
     * Prepares notification for either/both sending to redStore and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param data
     * @param tokens
     * @param pushTypes
     * @param isVoIP
     * @returns {*[][]}
     */
    static prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}, isVoIP = false) {
        const notification = RedStoreAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = [] // User can have many Remote Clients. Message is created for the user, so from 1 message there can be many notifications
        const pushContext = {}

        tokens.forEach((pushToken) => {
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const preparedData = prepareData(data, pushToken)
            const pushData = pushType === PUSH_TYPE_SILENT_DATA
                ? {
                    token: pushToken,
                    data: {
                        ...preparedData,
                        'title': notification.title,
                        'body': notification.body,
                    },
                    appId: get(data, 'appId'),
                    ...DEFAULT_PUSH_SETTINGS,
                }
                : {
                    token: pushToken,
                    data: preparedData,
                    notification,
                    appId: get(data, 'appId'),
                    ...DEFAULT_PUSH_SETTINGS,
                }

            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.app)) target.push(pushData)

            if (!pushContext[pushType]) pushContext[pushType] = pushData
        })

        return [notifications, fakeNotifications, pushContext]
    }

    /**
     * For testing purpose we have to emulate redStore response for predefined FAKE tokens,
     * because it's almost impossible to get real redStore push token in automated way.
     * @param result
     * @param fakeNotifications
     * @returns {*}
     */
    static injectFakeResults (result, fakeNotifications) {
        const mixed = !isObject(result) || isEmpty(result) ? getEmptyResult() : JSON.parse(JSON.stringify(result))

        fakeNotifications.forEach(({ token }) => {
            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(getFakeSuccessResponse())
            }

            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(getFakeErrorResponse())
            }
        })

        return mixed
    }

    /**
     * Manages to send notification to all available pushTokens of the user.
     * Also supports PUSH_FAKE_TOKEN_SUCCESS and PUSH_FAKE_TOKEN_FAIL for testing purposes
     * Would try to send request to redStore only if redStore is initialized and `tokens` array contains real (non-fake) items.
     * Would succeed if at least one real token succeeds in delivering notification through redStore, or
     * PUSH_FAKE_TOKEN_SUCCESS provided within tokens
     * @param notification
     * @param tokens
     * @param data
     * @param pushTypes
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, data, tokens, pushTypes } = {}, isVoIP = false) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, pushContext] = RedStoreAdapter.prepareBatchData(notification, data, tokens, pushTypes, isVoIP)
        let result
        console.log('insideRedStoreAdapter', 'logNotifications', notifications)

        console.log('insideRedStoreAdapter', 'EmptyNotifications', !isNull(this.#config) && !isEmpty(notifications))

        if (!isNull(this.#config) && !isEmpty(notifications)) {
            const notificationsByAppId = {}
            for (const notification of notifications) {
                const appId = notification.appId
                console.log('insideRedStoreAdapter', 'appId', appId)
                notificationsByAppId[appId] ||= []
                notificationsByAppId[appId].push(notification)
            }
            console.log('insideRedStoreAdapter', 'notificationsByAppId', notificationsByAppId)
            for (const [appId, notificationsBatchForApp] of Object.entries(notificationsByAppId)) {
                const configForApp = this.#config[appId]
                console.log('insideRedStoreAdapter', 'configForApp', appId, configForApp)
                if (!configForApp) {
                    logger.error({ msg: 'Unknown appId. Config was not found', appId })
                    continue
                }
                console.log('insideRedStoreAdapter', 'notificationsBatchForApp', appId, notificationsBatchForApp)

                const app = new RedStoreNotificationSender(configForApp)
                try {
                    const result = await app.sendAll(notificationsBatchForApp)

                    if (!isEmpty(result.responses)) {
                        result.responses = result.responses.map(
                            (response, idx) =>
                                ({
                                    ...response,
                                    pushToken: notifications[idx].token,
                                    pushType: get(pushTypes, notifications[idx].token, null),
                                })
                        )
                    }

                } catch (error) {
                    logger.error({ msg: 'sendNotification error', error })

                    result = { state: 'error', error }
                }
            }
        }

        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, { ...result, pushContext }]
    }
}

module.exports = {
    RedStoreAdapter,
    redStoreAdapterPrepareData: prepareData,
}