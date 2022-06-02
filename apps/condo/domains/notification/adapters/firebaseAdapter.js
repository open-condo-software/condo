const admin = require('firebase-admin')
const isEmpty = require('lodash/isEmpty')
const isNull = require('lodash/isNull')
const get = require('lodash/get')
const isString = require('lodash/isString')
const faker = require('faker')

const conf = require('@core/config')

const { logger } = require('@condo/domains/notification/utils')

const { PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL, FIREBASE_CONFIG_ENV } = require('../constants/constants')
const { EMPTY_CONFIG_ERROR, EMPTY_NOTIFICATION_TITLE_BODY_ERROR } = require('../constants/errors')

const FAKE_SUCCESS_MESSAGE_PREFIX = 'fake-success-message'

const FIREBASE_CONFIG = conf[FIREBASE_CONFIG_ENV] ? JSON.parse(conf[FIREBASE_CONFIG_ENV]) : null
const DEFAULT_PUSH_SETTINGS = { apns: { payload: { aps: { 'mutable-content': 1 } } } }

/**
 * Send push notification to pushToken via app, configured by FIREBASE_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class FirebaseAdapter {
    app = null
    projectId = null

    /**
     * Firebase rejects push if any of data fields is not a string, so we should convert all non-string fields to strings
     * @param data
     */
    static prepareData (data = {}) {
        const result = {}
        const invalidFields = []

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                result[key] = data[key]

                if (!isString(data[key])) {
                    result[key] = data[key].toString()
                    invalidFields.push([key, data[key]])
                }
            }
        }

        if (!isEmpty(invalidFields)) {
            logger.error(new Error('Push notification data fields should be strings.' + JSON.stringify(invalidFields)))
        }

        return result
    }

    constructor (config = FIREBASE_CONFIG, throwOnError = false) {
        try {
            if (isEmpty(config)) throw new Error(EMPTY_CONFIG_ERROR)

            this.app = admin.initializeApp({ credential: admin.credential.cert(config) })
        } catch (e) {
            // Broken FireBase config on production is critical
            // CI within build faze 'thinks' that it's production :(
            // if (!IS_BUILD_PHASE && IS_PRODUCTION || throwOnError) throw new Error(e)

            // For CI/local tests config is useless because of emulation via FAKE tokens
            logger.error(e)
        }
        this.projectId = get(config, 'project_id', null)
        this.messageIdPrefixRegexp = new RegExp(`projects/${this.projectId}/messages`)
    }

    /**
     * Mimics FireBase request result
     * @returns {{responses: *[], successCount: number, failureCount: number}}
     */
    getEmptyResult () {
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
    getFakeErrorResponse () {
        return {
            success: false,
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
    getFakeSuccessResponse () {
        return {
            success: true,
            messageId: `fake-success-message/${faker.datatype.uuid()}`,
        }
    }

    /**
     * Validates and prepares notification significant fields
     * @param title
     * @param body
     * @returns {{title, body}}
     */
    validateAndPrepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error(EMPTY_NOTIFICATION_TITLE_BODY_ERROR)

        return { title, body }
    }

    /**
     * Prepares notification for either/both sending to FireBase and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param data
     * @param tokens
     * @returns {*[][]}
     */
    prepareBatchData (notificationRaw, data, tokens = []) {
        const notification = this.validateAndPrepareNotification(notificationRaw)
        const notifications = []
        const fakeNotifications = []

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken.startsWith(PUSH_FAKE_TOKEN_SUCCESS) || pushToken.startsWith(PUSH_FAKE_TOKEN_FAIL)
            const target = isFakeToken ? fakeNotifications : notifications

            target.push({
                token: pushToken,
                data: FirebaseAdapter.prepareData(data),
                notification,
                ...DEFAULT_PUSH_SETTINGS,
            })
        })

        return [notifications, fakeNotifications]
    }

    /**
     * For testing purpose we have to emulate FireBase response for predefined FAKE tokens,
     * because it's almost impossible to get real FireBase push token in automated way.
     * @param result
     * @param fakeNotifications
     * @returns {*}
     */
    injectFakeResults (result, fakeNotifications) {
        const mixed = { ...result }

        fakeNotifications.forEach(({ token }) => {
            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(this.getFakeSuccessResponse())
            }
            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(this.getFakeErrorResponse())
            }
        })

        return mixed
    }

    /**
     * Manages to send notification to all available pushTokens of the user.
     * Also supports PUSH_FAKE_TOKEN_SUCCESS and PUSH_FAKE_TOKEN_FAIL for testing purposes
     * Would try to send request to FireBase only if FireBase is initialized and `tokens` array contains
     * real (non-fake) items.
     * Would succeed if at least one real token succeeds in delivering notification through FireBase, or
     * PUSH_FAKE_TOKEN_SUCCESS provided within tokens
     * @param notification
     * @param tokens
     * @param data
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, data, tokens } = {}) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, fakeNotifications] = this.prepareBatchData(notification, data, tokens)
        let result

        // If we come up to here and no real tokens provided, that means fakeNotifications contains
        // some FAKE tokens and emulation is required for testing purposes
        if (isEmpty(notifications)) {
            result = this.injectFakeResults(this.getEmptyResult(), fakeNotifications)
        }

        // NOTE: we try to fire FireBase request only if FireBase was initialized and we have some real notifications
        if (!isNull(this.app) && !isEmpty(notifications)) {
            try {
                const fbResult = await this.app.messaging().sendAll(notifications)

                result = this.injectFakeResults(fbResult, fakeNotifications)
            } catch (error) {
                logger.error(error)

                result = { state: 'error', error }
            }
        }

        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, result]
    }
}

module.exports = {
    FirebaseAdapter,
    FAKE_SUCCESS_MESSAGE_PREFIX,
    EMPTY_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
}