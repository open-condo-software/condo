const admin = require('firebase-admin')
const isEmpty = require('lodash/isEmpty')
const isNull = require('lodash/isNull')
const cloneDeep = require('lodash/cloneDeep')
const faker = require('faker')

const { PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL } = require('../constants/constants')

const FIREBASE_CONFIG_ENV = 'FIREBASE_CONFIG_JSON'

let FIREBASE_CONFIG = null

// JSON.parse would throw for a broken JSON, so we should take care of it here
try {
    FIREBASE_CONFIG = process.env[FIREBASE_CONFIG_ENV] && JSON.parse(process.env[FIREBASE_CONFIG_ENV])

    //TODO(DOMA-xxx): Validate FIREBASE_CONFIG_JSON structure
} catch (error) {
    throw new Error(`.env ${FIREBASE_CONFIG_ENV} is broken, should be valid JSON`)
}

const EMPTY_RESULT = {
    responses: [],
    successCount: 0,
    failureCount: 0,
}

// This fake response mimics FireBase failure response
const FAKE_ERROR_RESPONSE = {
    success: false,
    error: {
        errorInfo: {
            code: 'fake-error',
            message: 'Fake error message',
        },
    },
}

const FAKE_SUCCESS_MESSAGE_PREFIX = 'fake-success-message'

// This fake response fn mimics FireBase success response
const getFakeSuccessResponse = () => ({
    success: true,
    messageId: `fake-success-message/${faker.datatype.uuid()}`,
})

/**
 * Send push notification to pushToken via app, configured by FIREBASE_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class FirebaseAdapter {
    constructor (config = FIREBASE_CONFIG) {
        this.app = null

        if (isEmpty(config)) throw new Error(`Valid ${FIREBASE_CONFIG_ENV} should be provided within .helm (.env), and can be retrieved from https://console.firebase.google.com/project/__PROJECT_ID__/settings/serviceaccounts/adminsdk`)

        this.app = admin.initializeApp({ credential: admin.credential.cert(config) })
    }

    prepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error('Missing notification.title or notification.body')

        return { title, body }
    }

    prepareNotifications (notificationRaw, data, tokens = []) {
        const notification = this.prepareNotification(notificationRaw)
        const notifications = []
        const fakeNotifications = []

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken === PUSH_FAKE_TOKEN_SUCCESS || pushToken === PUSH_FAKE_TOKEN_FAIL
            const target = isFakeToken ? fakeNotifications : notifications

            target.push({
                token: pushToken,
                data,
                notification,
            })
        })

        return [notifications, fakeNotifications]
    }

    /**
     * For testing purpose we have to emulate FireBase response for predefined tokens, because it's almost
     * impossible to get real FireBase push token in automated way.
     * @param result
     * @param fakeNotifications
     * @returns {*}
     */
    injectFakeResults (result, fakeNotifications) {
        const mixed = { ...result }

        fakeNotifications.forEach(({ token }) => {
            if (token === PUSH_FAKE_TOKEN_SUCCESS) {
                mixed.successCount++
                mixed.responses.push(getFakeSuccessResponse())
            }
            if (token === PUSH_FAKE_TOKEN_FAIL) {
                mixed.failureCount++
                mixed.responses.push(cloneDeep(FAKE_ERROR_RESPONSE))
            }
        })

        return mixed
    }

    /**
     * Manage to send notification to all available pushTokens of the user.
     * Also supports PUSH_FAKE_TOKEN_SUCCESS and PUSH_FAKE_TOKEN_FAIL for testing purposes
     * Would try to send request to FireBase only if FireBase is initialized and tokens contains
     * real (non-fake) tokens.
     * Would succeed if at least one real token succeeds in delivering notification through FireBase, or
     * PUSH_FAKE_TOKEN_SUCCESS provided within tokens
     * @param notification
     * @param tokens
     * @param data
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, tokens, data } = {}) {
        if (!tokens || isEmpty(tokens)) return null

        const [notifications, fakeNotifications] = this.prepareNotifications(notification, data, tokens)
        let result

        if (isEmpty(notifications)) {
            result = this.injectFakeResults(cloneDeep(EMPTY_RESULT), fakeNotifications)
        }

        // NOTE: we try to fire FireBase request only if FireBase was initialized and we have some real notifications
        if (!isNull(this.app) && !isEmpty(notifications)) {
            try {
                const fbResult = await this.app.messaging().sendAll(notifications)

                result = this.injectFakeResults(fbResult, fakeNotifications)
            } catch (error) {
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
}