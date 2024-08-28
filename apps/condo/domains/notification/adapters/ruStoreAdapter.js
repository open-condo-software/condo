const { faker } = require('@faker-js/faker')
const { isEmpty, isNull, get, isObject } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { RuStoreNotificationSender } = require('@condo/domains/notification/adapters/RuStore/RuStoreNotificationSender')
const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    RUSTORE_CONFIG_ENV,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV,
} = require('@condo/domains/notification/constants/constants')
const { EMPTY_RUSTORE_CONFIG_ERROR, EMPTY_NOTIFICATION_TITLE_BODY_ERROR } = require('@condo/domains/notification/constants/errors')

const RUSTORE_CONFIG = conf[RUSTORE_CONFIG_ENV] ? JSON.parse(conf[RUSTORE_CONFIG_ENV]) : null
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []
const DEFAULT_PUSH_SETTINGS = {
    apns: { payload: { aps: { 'mutable-content': 1, sound: 'default' } } },
}
const HIGH_PRIORITY_SETTINGS = { android: { priority: 'high' } }

const logger = getLogger('firebaseAdapter')

/**
 * Send push notification to pushToken via app, configured by RUSTORE_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class RuStoreAdapter {
    projectId = null
    #config = null

    constructor (config = RUSTORE_CONFIG) {
        try {
            if (isEmpty(config)) throw new Error(EMPTY_RUSTORE_CONFIG_ERROR)
        } catch (error) {
            // For CI/local tests config is useless because of emulation via FAKE tokens
            logger.error({ msg: 'RuStore adapter error', error })
        }

        this.projectId = get(config, 'project_id', null)
        this.#config = config
        // not user input. No ReDoS regexp expected
        // nosemreg: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        this.messageIdPrefixRegexp = new RegExp(`projects/${this.projectId}/messages`)
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
        const image = 'CondoImage' // надо сюды вставить урл на иконку домов, чтобы не приходило голое уведомление

        return { title, body, image }
    }

    /**
     * Prepares notification for either/both sending to RuStore and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param data
     * @param tokens
     * @param pushTypes
     * @param isVoIP
     * @returns {*[][]}
     */
    static prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}, isVoIP = false) {
        const notification = RuStoreAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = [] // User can have many Remote Clients. Message is created for the user, so from 1 message there can be many notifications
        const fakeNotifications = []
        const pushContext = {}
        const extraPayload = isVoIP ? HIGH_PRIORITY_SETTINGS : {}

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken.startsWith(PUSH_FAKE_TOKEN_SUCCESS) || pushToken.startsWith(PUSH_FAKE_TOKEN_FAIL)
            const target = isFakeToken ? fakeNotifications : notifications
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const preparedData = RuStoreAdapter.prepareData(data, pushToken)
            const pushData = pushType === PUSH_TYPE_SILENT_DATA
                ? {
                    token: pushToken,
                    data: {
                        ...preparedData,
                        'title': notification.title,
                        'body': notification.body,
                    },
                    ...DEFAULT_PUSH_SETTINGS,
                    ...extraPayload,
                }
                : {
                    token: pushToken,
                    data: preparedData,
                    notification,
                    ...DEFAULT_PUSH_SETTINGS,
                    ...extraPayload,
                }

            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.app)) target.push(pushData)

            if (!pushContext[pushType]) pushContext[pushType] = pushData
        })

        return [notifications, fakeNotifications, pushContext]
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
     * Mimics RuStore failure response
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
                    status: 403,
                },
            },
        }
    }

    /**
     * Mimics RuStore success response
     * @returns {{success: boolean, messageId: string}}
     */
    static getFakeSuccessResponse () {
        return {
            success: true,
            type: 'Fake',
            messageId: `fake-success-message/${faker.datatype.uuid()}`,
        }
    }

    /**
     * For testing purpose we have to emulate RuStore response for predefined FAKE tokens,
     * because it's almost impossible to get real RuStore push token in automated way.
     * @param result
     * @param fakeNotifications
     * @returns {*}
     */
    static injectFakeResults (result, fakeNotifications) {
        const mixed = !isObject(result) || isEmpty(result) ? RuStoreAdapter.getEmptyResult() : JSON.parse(JSON.stringify(result))

        fakeNotifications.forEach(({ token }) => {
            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(RuStoreAdapter.getFakeSuccessResponse())
            }

            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(RuStoreAdapter.getFakeErrorResponse())
            }
        })

        return mixed
    }

    /**
     * Manages to send notification to all available pushTokens of the user.
     * Also supports PUSH_FAKE_TOKEN_SUCCESS and PUSH_FAKE_TOKEN_FAIL for testing purposes
     * Would try to send request to RuStore only if RuStore is initialized and `tokens` array contains real (non-fake) items.
     * Would succeed if at least one real token succeeds in delivering notification through RuStore, or
     * PUSH_FAKE_TOKEN_SUCCESS provided within tokens
     * @param notification
     * @param tokens
     * @param data
     * @param pushTypes
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, data, tokens, pushTypes } = {}, isVoIP = false) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, fakeNotifications, pushContext] = RuStoreAdapter.prepareBatchData(notification, data, tokens, pushTypes, isVoIP)
        let result

        // If we come up to here and no real tokens provided, that means fakeNotifications contains
        // some FAKE tokens and emulation is required for testing purposes
        if (isEmpty(notifications)) {
            result = RuStoreAdapter.injectFakeResults(RuStoreAdapter.getEmptyResult(), fakeNotifications)
        }

        if (!isNull(this.#config) && !isEmpty(notifications)) {
            const notificationsByAppId = {}
            for (const notification of notifications) {
                const appId = notification.appId
                notificationsByAppId[appId] ||= []
                notificationsByAppId[appId].push(notification)
            }
            for (const [appId, notificationsBatchForApp] of Object.entries(notificationsByAppId)) {
                const currentConfig = this.#config[appId]
                if (!currentConfig) {
                    logger.error({ msg: 'Unknown appId. Config was not found', appId })
                    continue
                }

                const app = new RuStoreNotificationSender(this.#config)
                try {
                    const ruStoreResult = await app.sendAll(notificationsBatchForApp)

                    if (!isEmpty(ruStoreResult.responses)) {
                        ruStoreResult.responses = ruStoreResult.responses.map(
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
    RuStoreAdapter,
    EMPTY_RUSTORE_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
}