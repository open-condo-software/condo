const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const isObject = require('lodash/isObject')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV,
    ONESIGNAL_CONFIG_ENV,
} = require('@condo/domains/notification/constants/constants')
const {
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
    EMPTY_ONESIGNAL_CONFIG_ERROR,
} = require('@condo/domains/notification/constants/errors')

const { OneSignalNotificationSender } = require('./oneSignal/oneSignalNotificationSender')

const ONESIGNAL_CONFIG = JSON.parse(conf[ONESIGNAL_CONFIG_ENV] || '{}')
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []

const logger = getLogger()


class OneSignalAdapter {
    /** @type {Record<string, OneSignalNotificationSender>} */
    appsByAppId = {}

    constructor (config = ONESIGNAL_CONFIG) {
        try {
            if (!isObject(config)) {
                throw new Error(`${EMPTY_ONESIGNAL_CONFIG_ERROR}`)
            }
            for (const [appId, appConfig] of Object.entries(config)) {
                this.appsByAppId[appId] = new OneSignalNotificationSender(appConfig)
            }
        } catch (error) {
            logger.error({ msg: 'OneSignal app init error', err: error })
        }
    }

    /**
     * Providers expect data to be Record<string, string>
     * @param data
     */
    static prepareData (data = {}) {
        const result = {}

        for (const key in data) {
            if (data.hasOwnProperty(key)) result[key] = String(data[key])
        }

        return result
    }

    /**
     * Validates and prepares notification significant fields
     * @param title
     * @param body
     * @returns {{title, body}}
     */
    static validateAndPrepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error(EMPTY_NOTIFICATION_TITLE_BODY_ERROR)

        return { title, body }
    }

    /**
     * Mimics FireBase request result
     * @returns {{responses: *[], successCount: number, failureCount: number}}
     */
    static getEmptyResult () {
        return {
            responses: [],
            successCount: 0,
            failureCount: 0,
        }
    }

    /**
     * Mimics FireBase failure response
     * @returns {{success: boolean, error: {errorInfo: {code: string, message: string}}}}
     */
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
            response: {
                id: '',
                errors: [
                    'All included players are not subscribed',
                ],
            },
        }
    }

    /**
     * Mimics FireBase success response
     * @returns {{success: boolean, messageId: string}}
     */
    static getFakeSuccessResponse () {
        return {
            success: true,
            type: 'Fake',
            response: {
                id: generateUUIDv4(),
            },
        }
    }

    /**
     * For testing purpose we have to emulate FireBase response for predefined FAKE tokens,
     * because it's almost impossible to get real FireBase push token in automated way.
     * @param result
     * @param fakeNotifications
     * @returns {*}
     */
    static injectFakeResults (result, fakeNotifications) {
        const mixed = !isObject(result) || isEmpty(result) ? OneSignalAdapter.getEmptyResult() : JSON.parse(JSON.stringify(result))

        fakeNotifications.forEach(({ token }) => {
            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(OneSignalAdapter.getFakeSuccessResponse())
            }

            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(OneSignalAdapter.getFakeErrorResponse())
            }
        })

        return mixed
    }

    /**
     * Prepares notification for either/both sending to FireBase and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param dataByToken
     * @param tokens
     * @param pushTypes
     * @param isVoIP
     * @param appIds
     * @returns {[import('@onesignal/node-onesignal').Notification[], import('@onesignal/node-onesignal').Notification[], {}]}
     */
    static prepareBatchData (notificationRaw, dataByToken, tokens = [], pushTypes = {}, isVoIP = false, appIds = {}) {
        const notification = OneSignalAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = []
        const fakeNotifications = []
        const pushContext = {}

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken.startsWith(PUSH_FAKE_TOKEN_SUCCESS) || pushToken.startsWith(PUSH_FAKE_TOKEN_FAIL)
            const target = isFakeToken ? fakeNotifications : notifications
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const appId = appIds[pushToken]

            const preparedData = dataByToken[pushToken]
            if (!preparedData) return

            const pushData = pushType === PUSH_TYPE_SILENT_DATA
                ? {
                    token: pushToken,
                    data: {
                        ...preparedData,
                        '_title': notification.title,
                        '_body': notification.body,
                    },
                    type: pushType,
                    appId: get(appIds, pushToken),
                }
                : {
                    token: pushToken,
                    data: preparedData,
                    notification,
                    type: pushType,
                    appId: get(appIds, pushToken),
                }


            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(appId)) target.push(pushData)

            if (!pushContext[pushType]) pushContext[pushType] = pushData
        })

        return [notifications, fakeNotifications, pushContext]
    }

    async sendNotificationsForApp ({ appId, notificationsBatchForApp, pushTypes, appIds, metaByToken, isVoIP }) {
        const app = this.appsByAppId[appId]
        if (!app) {
            logger.error({ msg: 'unknown appId. Config was not found', data: { appId } })
            return {
                state: 'error',
                error: 'unknown appId. Config was not found',
                appId,
                failureCount: notificationsBatchForApp.length,
                successCount: 0,
                responses: notificationsBatchForApp.map(notification => ({
                    pushToken: notification.token,
                    pushType: get(pushTypes, notification.token, null),
                    appId: appIds?.[notification.token] ?? null,
                    remoteClientMeta: metaByToken?.[notification.token] ?? null,
                })),
            }
        }

        try {
            const oneSignalResult = await app.sendAll(notificationsBatchForApp, isVoIP)
            if (!isEmpty(oneSignalResult.responses)) {
                oneSignalResult.responses = oneSignalResult.responses.map(
                    (response) => {
                        const pushToken = response.token
                        return {
                            ...response,
                            pushToken,
                            pushType: pushTypes?.[pushToken] ?? null,
                            appId: appIds?.[pushToken] ?? null,
                            remoteClientMeta: metaByToken?.[pushToken] ?? null,
                        }
                    })
            }
            return oneSignalResult
        } catch (err) {
            logger.error({ msg: 'sendNotification error', err })
            return {
                state: 'error',
                error: err,
                failureCount: notificationsBatchForApp.length,
                successCount: 0,
                responses: notificationsBatchForApp.map(notification => ({
                    pushToken: notification.token,
                    pushType: get(pushTypes, notification.token, null),
                    appId: appIds?.[notification.token] ?? null,
                    remoteClientMeta: metaByToken?.[notification.token] ?? null,
                })),
            }
        }
    }

    /**
     * Sends notifications in parallel through provider for each appId + unique notification body
     * @param notification
     * @param tokens
     * @param dataByToken
     * @param pushTypes
     * @param appIds - Object mapping pushToken to appId for routing notifications to the correct OneSignal app
     * @param metaByToken
     * @param isVoIP
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, dataByToken, tokens, pushTypes, appIds, metaByToken } = {}, isVoIP = false) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, fakeNotifications, pushContext] = OneSignalAdapter.prepareBatchData(
            notification,
            dataByToken,
            tokens,
            pushTypes,
            isVoIP,
            appIds
        )
        let result = OneSignalAdapter.getEmptyResult()
        
        if (notifications.length) {
            const notificationsByAppId = {}
            for (const notification of notifications) {
                const appId = notification.appId
                if (!notificationsByAppId[appId]) notificationsByAppId[appId] = []
                notificationsByAppId[appId].push(notification)
            }
            
            const sendByAppIdPromises = await Promise.allSettled(
                Object.entries(notificationsByAppId).map(async ([appId, notificationsBatchForApp]) => {
                    return await this.sendNotificationsForApp({
                        appId,
                        notificationsBatchForApp,
                        appIds,
                        metaByToken,
                        pushTypes,
                        isVoIP,
                    })
                })
            )

            for (const sendByAppIdPromise of sendByAppIdPromises) {
                if (sendByAppIdPromise.status !== 'fulfilled') {
                    result.failureCount++
                    result.responses.push({ error: sendByAppIdPromise.reason })
                    continue
                }
                const sendByAppIdResult = sendByAppIdPromise.value
                result.successCount += (sendByAppIdResult.successCount || 0)
                result.failureCount += (sendByAppIdResult.failureCount || 0)
                result.responses = (result.responses || []).concat(sendByAppIdResult.responses || [])
            }
        }

        result = OneSignalAdapter.injectFakeResults(result, fakeNotifications)
        
        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, { ...result, pushContext }]
    }
}

module.exports = {
    OneSignalAdapter,
    EMPTY_ONESIGNAL_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
}