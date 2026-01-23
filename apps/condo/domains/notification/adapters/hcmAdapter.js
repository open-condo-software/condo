const { isEmpty, isObject, isNull, get, cloneDeep } = require('lodash')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { safeFormatError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getLogger } = require('@open-condo/keystone/logging')


const { HUAWEI_SILENT_DATA_PUSH_ENABLED } = require('@condo/domains/common/constants/featureflags')
const {
    HCM_CONFIG_ENV,
    PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL,
    PUSH_TYPE_DEFAULT, PUSH_TYPE_SILENT_DATA,
    HUAWEI_APP_TYPE_BY_APP_ID,
    APP_MASTER_KEY, APP_RESIDENT_KEY,
} = require('@condo/domains/notification/constants/constants')
const {
    EMPTY_HCM_CONFIG_ERROR,
    HCM_UNSUPPORTED_APP_ID_ERROR,
    INVALID_HCM_CONFIG_ERROR,
    EMPTY_NOTIFICATION_TITLE_BODY_ERROR,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV,
} = require('@condo/domains/notification/constants/errors')

const {
    DEFAULT_NOTIFICATION_OPTIONS,
    PUSH_SUCCESS_CODE, PUSH_PARTIAL_SUCCESS_CODE, SUCCESS_CODES,
} = require('./hcm/constants')
const HCMMessaging = require('./hcm/messaging')

const HCM_CONFIG = conf[HCM_CONFIG_ENV] ? JSON.parse(conf[HCM_CONFIG_ENV]) : null
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []
const DEFAULT_PUSH_SETTINGS = {}
const CONFIG_VALIDATED_FIELDS = [APP_MASTER_KEY, APP_RESIDENT_KEY, `${APP_MASTER_KEY}.clientId`, `${APP_MASTER_KEY}.secret`, `${APP_RESIDENT_KEY}.clientId`, `${APP_RESIDENT_KEY}.secret`]
const IS_LOCAL_ENV = conf.SERVER_URL.includes('localhost')

const logger = getLogger()

/**
 * HCM is Huawei Cloud Messaging
 *
 * Send push notification to pushToken via app, configured by HCM_CONFIG in .helm (.env)
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_IDs.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class HCMAdapter {
    apps = {
        [APP_RESIDENT_KEY]: null,
        [APP_MASTER_KEY]: null,
    }
    #configErrors = []

    constructor (config = HCM_CONFIG) {
        try {
            HCMAdapter.validateConfig(config)

            this.apps[APP_MASTER_KEY] = new HCMMessaging(config[APP_MASTER_KEY])
            this.apps[APP_RESIDENT_KEY] = new HCMMessaging(config[APP_RESIDENT_KEY])
        } catch (error) {

            this.#configErrors.push(error)
            // For CI/local tests config is useless because of emulation via FAKE tokens
            logger.error({ msg: 'HCMAdapter error', err: error })
        }
    }

    /**
     * Return app type (resident/master) based on appId detected by token
     * @param appIds
     * @param token
     * @returns {*}
     */
    static getAppType (appIds, token) {
        return HUAWEI_APP_TYPE_BY_APP_ID[get(appIds, token)]
    }

    /**
     * Validates HCM config
     * @param config
     */
    static validateConfig (config) {
        if (isEmpty(config)) throw new Error(EMPTY_HCM_CONFIG_ERROR)

        CONFIG_VALIDATED_FIELDS.forEach(
            (field) => {
                if (isEmpty(get(config, field))) throw new Error(`${INVALID_HCM_CONFIG_ERROR} Field missing: ${field}`)
            }
        )
    }

    /**
     * Converts all non-string fields to string
     * @param data
     * @param token
     * @returns {{token}}
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
     * @returns {{title, body, click_action: {type: number}}}
     */
    static validateAndPrepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error(EMPTY_NOTIFICATION_TITLE_BODY_ERROR)

        return { title, body, ...DEFAULT_NOTIFICATION_OPTIONS }
    }

    /**
     * Prepares common result data structure
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
     * Mimics HMS failure response
     * @param token
     * @returns {{msg: string, code: string, requestId}}
     */
    static getFakeErrorResponse (token, appType) {
        return {
            code: PUSH_PARTIAL_SUCCESS_CODE,
            msg: `{"success":0,"failure":1,"illegal_tokens":["${token}"]}`,
            type: 'Fake',
            pushToken: token,
            appType,
            requestId: Date.now(),
        }
    }

    /**
     * Mimics HMS success response
     * @returns {{msg: string, code: string, requestId}}
     */
    static getFakeSuccessResponse (token, appType) {
        return {
            code: PUSH_SUCCESS_CODE,
            msg: 'Success',
            type: 'Fake',
            pushToken: token,
            appType,
            requestId: Date.now(),
        }

    }

    /**
     * For testing purpose we have to emulate HMS response for predefined FAKE tokens,
     * because it's almost impossible to get real FireBase push token in automated way.
     * @param result
     * @param fakeNotifications
     * @returns {*}
     */
    static injectFakeResults (result, fakeNotifications, appIds) {
        const mixed = !isObject(result) || isEmpty(result) ? HCMAdapter.getEmptyResult() : JSON.parse(JSON.stringify(result))

        fakeNotifications.forEach(({ token }) => {
            const appType = HCMAdapter.getAppType(appIds, token)

            if (token.startsWith(PUSH_FAKE_TOKEN_SUCCESS)) {
                mixed.successCount++
                mixed.responses.push(HCMAdapter.getFakeSuccessResponse(token, appType))
            }

            if (token.startsWith(PUSH_FAKE_TOKEN_FAIL)) {
                mixed.failureCount++
                mixed.responses.push(HCMAdapter.getFakeErrorResponse(token, appType))
            }
        })

        return mixed
    }

    /**
     * Prepares notification for either/both sending to HMS and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param data
     * @param tokens
     * @param pushTypes
     * @returns {Promise<[[], [], {}]>}
     */
    static async prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}) {
        const isSilentDataPushEnabled = IS_LOCAL_ENV || await featureToggleManager.isFeatureEnabled(null, HUAWEI_SILENT_DATA_PUSH_ENABLED)
        const notification = HCMAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = []
        const fakeNotifications = []
        const pushContext = {}

        tokens.forEach((pushToken) => {
            const isFakeToken = pushToken.startsWith(PUSH_FAKE_TOKEN_SUCCESS) || pushToken.startsWith(PUSH_FAKE_TOKEN_FAIL)
            const target = isFakeToken ? fakeNotifications : notifications
            const pushType = pushTypes[pushToken] || PUSH_TYPE_DEFAULT
            const preparedData = HCMAdapter.prepareData(data, pushToken)
            const pushData = isSilentDataPushEnabled && pushType === PUSH_TYPE_SILENT_DATA
                ? {
                    token: pushToken,
                    data: JSON.stringify({
                        ...preparedData,
                        '_title': notification.title,
                        '_body': notification.body,
                    }),
                    ...DEFAULT_PUSH_SETTINGS,
                }
                : {
                    token: pushToken,
                    data: preparedData,
                    notification,
                    ...DEFAULT_PUSH_SETTINGS,
                }

            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.app)) target.push(pushData)

            if (!pushContext[pushType]) pushContext[pushType] = pushData
        })

        return [notifications, fakeNotifications, pushContext]
    }

    /**
     * Manages to send notification to all available pushTokens of the user.
     * Also supports PUSH_FAKE_TOKEN_SUCCESS and PUSH_FAKE_TOKEN_FAIL for testing purposes
     * Would try to send request to HMS only if HMS is initialized and `tokens` array contains real (non-fake) items.
     * Would succeed if at least one real token succeeds in delivering notification through HMS, or
     * PUSH_FAKE_TOKEN_SUCCESS provided within tokens
     * @param notification
     * @param data
     * @param tokens
     * @param pushTypes
     * @param appIds
     * @returns {Promise<[boolean, {error: string}]|[boolean, (*&{pushContext: (*[]|{})})]>}
     */
    async sendNotification ({ notification, data, tokens, pushTypes, appIds } = {}) {

        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications, fakeNotifications, pushContext] = await HCMAdapter.prepareBatchData(notification, data, tokens, pushTypes)
        // TODO (@toplenboren) DOMA-10611 remove excessive logging
        logger.info({
            msg: 'sendNotification prepareBatchData done',
            data: {
                args: { notification, data, tokens, pushTypes },
                result: { notifications, fakeNotifications, pushContext },
            },
        })

        let result

        // If we come up to here and no real tokens provided, that means fakeNotifications contains
        // some FAKE tokens and emulation is required for testing purposes
        if (isEmpty(notifications)) {
            result = HCMAdapter.injectFakeResults(HCMAdapter.getEmptyResult(), fakeNotifications, appIds)
        }

        if (isEmpty(fakeNotifications) && !isEmpty(notifications) && !isEmpty(this.#configErrors)) {
            const hcmResult = HCMAdapter.getEmptyResult()

            hcmResult.failureCount += 1
            hcmResult.responses.push({ state: 'error', error: 'No Huawei config available.', details: this.#configErrors, apps: this.apps })

            return [false, { ...hcmResult, pushContext }]
        }

        // NOTE: we try to fire HCM request only if HCM was initialized and we have some real notifications
        if (!isNull(this.apps[APP_MASTER_KEY]) && !isNull(this.apps[APP_RESIDENT_KEY]) && !isEmpty(notifications)) {
            const hcmResult = HCMAdapter.getEmptyResult()

            const promises = await Promise.allSettled(notifications.map(async (_, idx) => {
                const notification = cloneDeep(notifications[idx])

                // TODO (@toplenboren) DOMA-10611 remove excessive logging
                logger.info({ msg: 'sendNotification processing notification', data: { args: { notification } } })

                const appType = HCMAdapter.getAppType(appIds, notification.token)

                const app = this.apps[appType]

                try {
                    if (!appType || !app) throw new Error(`${HCM_UNSUPPORTED_APP_ID_ERROR}: ${get(appIds, notification.token)}`)
                    const sendResult = await app.send(notification)
                    return {
                        idx,
                        appType,
                        pushToken: notification.token,
                        pushType: pushTypes[notification.token],
                        ...sendResult,
                    }
                } catch (error) {
                    const safeError = safeFormatError(error, false)
                    logger.error({ msg: 'sendNotification error', error: safeError })
                    return { state: 'error', error: safeError }
                }
            }))

            for (const p of promises) {
                if (p.status !== 'fulfilled') {
                    hcmResult.failureCount++
                    hcmResult.responses.push({ error: p.reason })
                    continue
                }
                const response = p.value
                hcmResult.responses.push(response)

                if (response.state === 'error') {
                    hcmResult.failureCount++
                    continue
                }

                if (response.code === PUSH_SUCCESS_CODE) hcmResult.successCount += 1

                if (response.code === PUSH_PARTIAL_SUCCESS_CODE) {
                    try {
                        const json = JSON.parse(response.msg)

                        hcmResult.successCount += json.success
                        hcmResult.failureCount += json.failure
                    } catch (err) {
                        hcmResult.failureCount++
                    }
                }

                if (!SUCCESS_CODES.includes(response.code)) hcmResult.failureCount += 1
            }

            // TODO (@toplenboren) DOMA-10611 remove excessive logging
            logger.info({
                msg: 'sendNotification end',
                data: {
                    result: hcmResult,
                    args: { notification, notifications, fakeNotifications, appIds },
                },
            })

            result = HCMAdapter.injectFakeResults(hcmResult, fakeNotifications, appIds)
        }

        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, { ...result, pushContext }]
    }

}

module.exports = HCMAdapter
