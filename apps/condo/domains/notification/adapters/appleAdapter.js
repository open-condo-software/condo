const { isEmpty, isNull, get, isObject } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    APPLE_CONFIG_ENV,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV,
} = require('@condo/domains/notification/constants/constants')
const { EMPTY_APPLE_CONFIG_ERROR, EMPTY_NOTIFICATION_TITLE_BODY_ERROR } = require('@condo/domains/notification/constants/errors')

const AppleMessaging = require('./apple/AppleMessaging')
const { APS_RESPONSE_STATUS_SUCCESS } = require('./apple/constants')

const APPLE_CONFIG = conf[APPLE_CONFIG_ENV] ? JSON.parse(conf[APPLE_CONFIG_ENV]) : null
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []
const DEFAULT_PUSH_SETTINGS = {
    aps: {
        'mutable-content': 1,
        sound: 'default',
    },
}

const logger = getLogger()

/**
 * Send push notification to pushToken via app, configured by APPLE_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class AppleAdapter {
    #config = null

    constructor (config = APPLE_CONFIG) {

        try {
            if (isEmpty(config)) throw new Error(EMPTY_APPLE_CONFIG_ERROR)

            // This will could throw on config validation
            this.#config = config
        } catch (error) {
            // For CI/local tests config is useless because of emulation via FAKE tokens
            logger.error({ msg: 'AppleAdapter error', err: error })
        }
    }

    /**
     * Firebase rejects push if any of data fields is not a string, so we should convert all non-string fields to strings
     * @param data
     */
    static prepareData (data = {}, token) {
        const result = { token }

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
     * Mimics Apple push request result
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
     * Mimics Apple push failure response
     * @returns {{success: boolean, error: {errorInfo: {code: string, message: string}}}}
     */
    static getFakeErrorResponse () {
        return {
            success: false,
            type: 'Fake',
            state: 'error',
            error: {
                reason: 'fake-error',
                'apns-id': `fake-error-message/${Date.now()}`,
            },
        }
    }

    /**
     * Mimics Apple push success response
     * @returns {{success: boolean, messageId: string}}
     */
    static getFakeSuccessResponse () {
        return {
            success: true,
            type: 'Fake',
            status: APS_RESPONSE_STATUS_SUCCESS,
            headers: {
                ':status': APS_RESPONSE_STATUS_SUCCESS,
                'apns-id': `fake-success-message/${Date.now()}`,
            },
        }
    }

    /**
     * For testing purpose we have to emulate Apple push response for predefined FAKE tokens,
     * because it's almost impossible to get real Apple push token in automated way.
     * @param result
     * @param fakeNotifications
     * @returns {*}
     */
    static injectFakeResults (result, fakeNotifications) {
        const mixed = !isObject(result) || isEmpty(result) ? AppleAdapter.getEmptyResult() : JSON.parse(JSON.stringify(result))

        fakeNotifications.forEach(({ token }) => {
            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(AppleAdapter.getFakeSuccessResponse())
            }

            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(AppleAdapter.getFakeErrorResponse())
            }
        })

        return mixed
    }

    /**
     * Prepares notification for either/both sending to Apple push and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param data
     * @param tokens
     * @returns {*[][]}
     */
    static prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}, appIds) {
        const notification = AppleAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = [] // User can have many Remote Clients. Message is created for the user, so from 1 message there can be many notifications
        const fakeNotifications = []
        const pushContext = {}

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken.startsWith(PUSH_FAKE_TOKEN_SUCCESS) || pushToken.startsWith(PUSH_FAKE_TOKEN_FAIL)
            const target = isFakeToken ? fakeNotifications : notifications
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const preparedData = AppleAdapter.prepareData(data, pushToken)
            const pushData = pushType === PUSH_TYPE_SILENT_DATA
                ? {
                    token: pushToken,
                    data: {
                        ...preparedData,
                        '_title': notification.title,
                        '_body': notification.body,
                    },
                    ...DEFAULT_PUSH_SETTINGS,
                    type: pushType,
                    appId: get(appIds, pushToken),
                }
                : {
                    token: pushToken,
                    data: preparedData,
                    notification,
                    ...DEFAULT_PUSH_SETTINGS,
                    type: pushType,
                    appId: get(appIds, pushToken),
                }

            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.app)) target.push(pushData)

            if (!pushContext[pushType]) pushContext[pushType] = pushData
        })

        return [notifications, fakeNotifications, pushContext]
    }

    /**
     * Manages to send notification to all available pushTokens of the user.
     * Also supports PUSH_FAKE_TOKEN_SUCCESS and PUSH_FAKE_TOKEN_FAIL for testing purposes
     * Would try to send request to Apple only if Apple is initialized and `tokens` array contains real (non-fake) items.
     * Would succeed if at least one real token succeeds in delivering notification through Apple push, or
     * PUSH_FAKE_TOKEN_SUCCESS provided within tokens
     * @param notification
     * @param tokens
     * @param data
     * @param pushTypes
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, data, tokens, pushTypes, appIds } = {}, isVoIP = false) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, fakeNotifications, pushContext] = AppleAdapter.prepareBatchData(notification, data, tokens, pushTypes, appIds)
        let result

        // If we come up to here and no real tokens provided, that means fakeNotifications contains
        // some FAKE tokens and emulation is required for testing purposes
        if (isEmpty(notifications)) {
            result = AppleAdapter.injectFakeResults(AppleAdapter.getEmptyResult(), fakeNotifications)
        }

        // NOTE: we try to fire Apple push request only if Apple push was initialized and we have some real notifications
        if (!isNull(this.#config) && !isEmpty(notifications)) {
            const notificationsByAppId = {}
            for (const notification of notifications) {
                const appId = notification.appId
                notificationsByAppId[appId] ||= []
                notificationsByAppId[appId].push(notification)
            }
            for (const [appId, notificationsBatchForApp] of Object.entries(notificationsByAppId)) {
                const configForApp = this.#config[appId]
                if (!configForApp) {
                    logger.error({ msg: 'unknown appId. Config was not found', data: { appId } })
                    continue
                }

                const app = new AppleMessaging(configForApp)

                try {
                    const appleResult = await app.sendAll(notificationsBatchForApp, isVoIP)

                    if (!isEmpty(appleResult.responses)) {
                        appleResult.responses = appleResult.responses.map(
                            (response, idx) =>
                                ({
                                    ...response,
                                    pushToken: notificationsBatchForApp[idx].token,
                                    pushType: pushTypes[notificationsBatchForApp[idx].token],
                                    appleServerUrl: configForApp.url,
                                })
                        )
                    }

                    result = AppleAdapter.injectFakeResults(appleResult, fakeNotifications)
                } catch (err) {
                    logger.error({ msg: 'sendNotification error', err })
                    result = { state: 'error', error: err }
                }
            }
        }

        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, { ...result, pushContext }]
    }
}

module.exports = {
    AppleAdapter,
    EMPTY_APPLE_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
}