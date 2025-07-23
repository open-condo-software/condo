const admin = require('firebase-admin')
const { isEmpty, isNull, get, isObject } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const {
    PUSH_FAKE_TOKEN_SUCCESS,
    PUSH_FAKE_TOKEN_FAIL,
    FIREBASE_CONFIG_ENV,
    PUSH_TYPE_DEFAULT,
    PUSH_TYPE_SILENT_DATA,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV,
} = require('@condo/domains/notification/constants/constants')
const { EMPTY_FIREBASE_CONFIG_ERROR, EMPTY_NOTIFICATION_TITLE_BODY_ERROR } = require('@condo/domains/notification/constants/errors')

const FIREBASE_CONFIG = conf[FIREBASE_CONFIG_ENV] ? JSON.parse(conf[FIREBASE_CONFIG_ENV]) : null
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []
const DEFAULT_PUSH_SETTINGS = {
    apns: { payload: { aps: { 'mutable-content': 1, sound: 'default' } } },
}

const DEFAULT_SILENT_PUSH_SETTINGS = {
    apns: {
        headers: {
            'apns-push-type': 'background',
        },
        payload: {
            aps: {
                'mutable-content': 1,
                contentAvailable: true,
            },
        },
    },
}

const HIGH_PRIORITY_SETTINGS = { android: { priority: 'high' } }

const logger = getLogger()

/**
 * Send push notification to pushToken via app, configured by FIREBASE_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class FirebaseAdapter {
    app = null
    projectId = null

    constructor (config = FIREBASE_CONFIG) {
        try {
            if (isEmpty(config)) throw new Error(EMPTY_FIREBASE_CONFIG_ERROR)

            this.app = admin.initializeApp({ credential: admin.credential.cert(config) })
        } catch (error) {
            // For CI/local tests config is useless because of emulation via FAKE tokens
            logger.error({ msg: 'FirebaseAdapter error', err: error })
        }

        this.projectId = get(config, 'project_id', null)
        // not an user input. No ReDoS regexp expected
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
            messageId: `fake-success-message/${Date.now()}`,
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
        const mixed = !isObject(result) || isEmpty(result) ? FirebaseAdapter.getEmptyResult() : JSON.parse(JSON.stringify(result))

        fakeNotifications.forEach(({ token }) => {
            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(FirebaseAdapter.getFakeSuccessResponse())
            }

            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(FirebaseAdapter.getFakeErrorResponse())
            }
        })

        return mixed
    }

    /**
     * Prepares notification for either/both sending to FireBase and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param data
     * @param tokens
     * @returns {*[][]}
     */
    static prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}, isVoIP = false) {
        const notification = FirebaseAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = []
        const fakeNotifications = []
        const pushContext = {}
        const extraPayload = isVoIP ? HIGH_PRIORITY_SETTINGS : {}

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken.startsWith(PUSH_FAKE_TOKEN_SUCCESS) || pushToken.startsWith(PUSH_FAKE_TOKEN_FAIL)
            const target = isFakeToken ? fakeNotifications : notifications
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const preparedData = FirebaseAdapter.prepareData(data, pushToken)
            const pushData = pushType === PUSH_TYPE_SILENT_DATA
                ? {
                    token: pushToken,
                    data: {
                        ...preparedData,
                        '_title': notification.title,
                        '_body': notification.body,
                    },
                    ...DEFAULT_SILENT_PUSH_SETTINGS,
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
     * Manages to send notification to all available pushTokens of the user.
     * Also supports PUSH_FAKE_TOKEN_SUCCESS and PUSH_FAKE_TOKEN_FAIL for testing purposes
     * Would try to send request to FireBase only if FireBase is initialized and `tokens` array contains real (non-fake) items.
     * Would succeed if at least one real token succeeds in delivering notification through FireBase, or
     * PUSH_FAKE_TOKEN_SUCCESS provided within tokens
     * @param notification
     * @param tokens
     * @param data
     * @param pushTypes
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, data, tokens, pushTypes } = {}, isVoIP = false) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, fakeNotifications, pushContext] = FirebaseAdapter.prepareBatchData(notification, data, tokens, pushTypes, isVoIP)
        let result

        // If we come up to here and no real tokens provided, that means fakeNotifications contains
        // some FAKE tokens and emulation is required for testing purposes
        if (isEmpty(notifications)) {
            result = FirebaseAdapter.injectFakeResults(FirebaseAdapter.getEmptyResult(), fakeNotifications)
        }

        // NOTE: we try to fire FireBase request only if FireBase was initialized and we have some real notifications
        if (!isNull(this.app) && !isEmpty(notifications)) {
            try {
                const fbResult = await this.app.messaging().sendEach(notifications)

                if (!isEmpty(fbResult.responses)) {
                    fbResult.responses = fbResult.responses.map(
                        (response, idx) =>
                            ({
                                ...response,
                                pushToken: notifications[idx].token,
                                pushType: get(pushTypes, notifications[idx].token, null),
                            })
                    )
                }

                result = FirebaseAdapter.injectFakeResults(fbResult, fakeNotifications)
            } catch (error) {
                logger.error({ msg: 'sendNotification error', err: error })

                result = { state: 'error', error }
            }
        }

        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, { ...result, pushContext }]
    }
}

module.exports = {
    FirebaseAdapter,
    EMPTY_FIREBASE_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
}