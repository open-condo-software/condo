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
    _config = null

    constructor (config = REDSTORE_CONFIG) {
        try {
            if (isEmpty(config)) throw new Error(`Valid ${REDSTORE_CONFIG_ENV} should be provided within .helm (.env)`)
        } catch (err) {
            // For CI/local tests config is useless because of emulation via FAKE tokens
            logger.error({ msg: 'redStore adapter error', err })
        }

        this._config = config
    }

    /**
     * Validates and prepares notification significant fields
     * @param title
     * @param body
     * @returns {{title, body}}
     */
    static validateAndPrepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error('Missing notification.title or notification.body')

        return { title, body }
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
    static prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}, appIds = {}, isVoIP = false) {
        const notification = RedStoreAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = [] // User can have many Remote Clients. Message is created for the user, so from 1 message there can be many notifications
        const pushContext = {}

        tokens.forEach((pushToken) => {
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const preparedData = prepareData(data, pushToken)
            const pushData = {
                token: pushToken,
                data: preparedData,
                notification,
                appId: appIds[pushToken],
                ...DEFAULT_PUSH_SETTINGS,
            }

            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(pushData.appId)) notifications.push(pushData)

            if (!pushContext[pushType]) pushContext[pushType] = pushData
        })

        return [notifications, pushContext]
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
    async sendNotification ({ notification, data, tokens, pushTypes, appIds } = {}, isVoIP = false) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, pushContext] = RedStoreAdapter.prepareBatchData(notification, data, tokens, pushTypes, appIds, isVoIP)
        let result
        console.log('insideRedStoreAdapter', 'logNotifications', notifications)

        console.log('insideRedStoreAdapter', 'EmptyNotifications', !isNull(this._config) && !isEmpty(notifications))

        if (!isNull(this._config) && !isEmpty(notifications)) {
            const notificationsByAppId = {}
            for (const notification of notifications) {
                const appId = notification.appId
                notificationsByAppId[appId] ||= []
                notificationsByAppId[appId].push(notification)
            }
            for (const [appId, notificationsBatchForApp] of Object.entries(notificationsByAppId)) {
                const configForApp = this._config[appId]
                if (!configForApp) {
                    logger.error({ msg: 'Unknown appId. Config was not found', appId })
                    continue
                }
                console.log('insideRedStoreAdapter', 'notificationsBatchForApp', appId, notificationsBatchForApp)

                const app = new RedStoreNotificationSender(configForApp)
                try {
                    result = await app.sendAll(notificationsBatchForApp)

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