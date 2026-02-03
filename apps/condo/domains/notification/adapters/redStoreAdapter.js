const { isEmpty, isNull, get, isObject } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { RedStoreNotificationSender } = require('@condo/domains/notification/adapters/redStore/redStoreNotificationSender')
const {
    REDSTORE_CONFIG_ENV,
    PUSH_TYPE_DEFAULT,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV,
} = require('@condo/domains/notification/constants/constants')

const { PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL } = require('../constants/constants')

const REDSTORE_CONFIG = conf[REDSTORE_CONFIG_ENV] ? JSON.parse(conf[REDSTORE_CONFIG_ENV]) : null
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []
const DEFAULT_PUSH_SETTINGS = {}

const logger = getLogger()

/**
 * Send push notification to pushToken via app, configured by REDSTORE_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class RedStoreAdapter {
    _config = null

    constructor (config = REDSTORE_CONFIG) {
        if (isEmpty(config)) logger.error({
            msg: 'redStore adapter error',
            err: new Error(`Valid ${REDSTORE_CONFIG_ENV} should be provided within .helm (.env)`),
        })

        this._config = config
    }

    static prepareData (data = {}, token) {
        const result = { token }

        for (const key in data) {
            if (data.hasOwnProperty(key)) result[key] = String(data[key])
        }

        return result
    }

    /**
     * Validates and prepares notification significant fields
     * @param {string} title
     * @param {string} body
     * @returns {{title, body}}
     */
    static validateAndPrepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error('Missing notification.title or notification.body')

        return { title, body }
    }

    static getEmptyResult () {
        return {
            responses: [],
            successCount: 0,
            failureCount: 0,
        }
    }

    static getFakeErrorResponse () {
        return {
            success: false,
            type: 'Fake',
            error: {
                errorInfo: {
                    code: 'fake-error',
                    message: 'Fake error message',
                },
            },
        }
    }

    static getFakeSuccessResponse () {
        return {
            success: true,
            type: 'Fake',
            messageId: `fake-success-message/${Date.now()}`,
        }
    }

    static injectFakeResults (result, fakeNotifications) {
        const mixed = !isObject(result) || isEmpty(result) ? RedStoreAdapter.getEmptyResult() : JSON.parse(JSON.stringify(result))

        fakeNotifications.forEach(({ token }) => {
            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(RedStoreAdapter.getFakeSuccessResponse())
            }

            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(RedStoreAdapter.getFakeErrorResponse())
            }
        })

        return mixed
    }

    /**
     * Prepares notification for either/both sending to redStore
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     */
    static prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}, appIds = {}, isVoIP = false) {
        const notification = RedStoreAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = [] // User can have many Remote Clients. Message is created for the user, so from 1 message there can be many notifications
        const fakeNotifications = []
        const pushContext = {}

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken.startsWith(PUSH_FAKE_TOKEN_SUCCESS) || pushToken.startsWith(PUSH_FAKE_TOKEN_FAIL)
            const target = isFakeToken ? fakeNotifications : notifications
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const preparedData = RedStoreAdapter.prepareData(data, pushToken)
            const pushData = {
                token: pushToken,
                data: preparedData,
                notification,
                appId: appIds[pushToken],
                ...DEFAULT_PUSH_SETTINGS,
            }

            // TODO(pahaz): check why `pushData.appId` used. but `data.app` is everywhere?!
            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(appIds[pushToken]) && !APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.app) && !APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.appId)) target.push(pushData)

            if (!pushContext[pushType]) pushContext[pushType] = pushData
        })

        return [notifications, fakeNotifications, pushContext]
    }

    /**
     * Manages to send notification to all available pushTokens of the user.
     */
    async sendNotification ({ notification, data, tokens, pushTypes, appIds, metaByToken } = {}, isVoIP = false) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, fakeNotifications, pushContext] = RedStoreAdapter.prepareBatchData(notification, data, tokens, pushTypes, appIds, isVoIP)
        let result

        // If we come up to here and no real tokens provided, that means fakeNotifications contains
        // some FAKE tokens and emulation is required for testing purposes
        if (isEmpty(notifications)) {
            result = RedStoreAdapter.injectFakeResults(RedStoreAdapter.getEmptyResult(), fakeNotifications)
        }

        if (!isNull(this._config) && !isEmpty(notifications)) {
            const notificationsByAppId = {}
            for (const notification of notifications) {
                const appId = notification.appId
                notificationsByAppId[appId] ||= []
                notificationsByAppId[appId].push(notification)
            }
            const promises = await Promise.allSettled(Object.entries(notificationsByAppId).map(async ([appId, notificationsBatchForApp]) => {
                const configForApp = this._config[appId]
                if (!configForApp) {
                    logger.error({ msg: 'unknown appId. Config was not found', data: { appId } })
                    return {
                        state: 'error',
                        error: 'unknown appId. Config was not found',
                        appId,
                        failureCount: notificationsBatchForApp.length,
                        successCount: 0,
                        responses: notificationsBatchForApp.map(notification => ({
                            pushToken: notification.token,
                            pushType: pushTypes?.[notification.token] ?? null,
                            appId: appIds?.[notification.token] ?? null,
                            remoteClientMeta: metaByToken?.[notification.token] ?? null,
                        })),
                    }
                }

                const app = new RedStoreNotificationSender(configForApp)
                try {
                    const result = await app.sendAll(notificationsBatchForApp)
                    if (!isEmpty(result.responses)) {
                        result.responses = result.responses.map(
                            (response, idx) => {
                                const pushToken = notificationsBatchForApp[idx].token
                                return {
                                    ...response,
                                    pushToken,
                                    pushType: pushTypes?.[pushToken] ?? null,
                                    appId: appIds?.[pushToken] ?? null,
                                    remoteClientMeta: metaByToken?.[pushToken] ?? null,
                                }
                            })
                    }
                    return result
                } catch (err) {
                    logger.error({ msg: 'sendNotification error', err })
                    return {
                        state: 'error',
                        error: err,
                        appId,
                        failureCount: notificationsBatchForApp.length,
                        successCount: 0,
                        responses: notificationsBatchForApp.map(notification => ({
                            pushToken: notification.token,
                            pushType: pushTypes?.[notification.token] ?? null,
                            appId: appIds?.[notification.token] ?? null,
                            remoteClientMeta: metaByToken?.[notification.token] ?? null,
                        })),
                    }
                }
            }))

            const combinedResult = RedStoreAdapter.getEmptyResult()
            for (const p of promises) {
                if (p.status !== 'fulfilled') {
                    combinedResult.failureCount++
                    combinedResult.responses.push({ error: p.reason })
                    continue
                }
                const result = p.value
                combinedResult.successCount += (result.successCount || 0)
                combinedResult.failureCount += (result.failureCount || 0)
                combinedResult.responses = (combinedResult.responses || []).concat(result.responses || [])
            }
            result = combinedResult
        }

        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, { ...result, pushContext }]
    }
}

module.exports = {
    RedStoreAdapter,
}