const { isEmpty, get } = require('lodash')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const {
    WEBHOOK_CONFIG_ENV,
    APPS_WITH_DISABLED_NOTIFICATIONS_ENV, PUSH_TYPE_DEFAULT,
} = require('@condo/domains/notification/constants/constants')
const { EMPTY_WEBHOOK_CONFIG_ERROR, EMPTY_NOTIFICATION_TITLE_BODY_ERROR } = require('@condo/domains/notification/constants/errors')

const WEBHOOK_CONFIG = conf[WEBHOOK_CONFIG_ENV] ? JSON.parse(conf[WEBHOOK_CONFIG_ENV]) : null
const APPS_WITH_DISABLED_NOTIFICATIONS = conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV] ? JSON.parse(conf[APPS_WITH_DISABLED_NOTIFICATIONS_ENV]) : []

const logger = getLogger()

class WebhookAdapter {
    #config = null

    constructor (config = WEBHOOK_CONFIG) {
        if (isEmpty(config)) throw new Error(EMPTY_WEBHOOK_CONFIG_ERROR)
        this.#config = config
    }

    /**
     * Convert all non-string fields to strings
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
        const t = typeof title === 'string' ? title.trim() : ''
        const b = typeof body === 'string' ? body.trim() : ''
        if (!t || !b) throw new Error(EMPTY_NOTIFICATION_TITLE_BODY_ERROR)
        return { title: t, body: b }
    }

    /**
     * Prepares notification for either/both sending to Apple push and/or emulation if FAKE tokens present
     * Converts single notification to notifications array (for multiple tokens provided) for batch request
     * @param notificationRaw
     * @param data
     * @param tokens
     * @param pushTypes
     * @param appIds
     * @returns {*[][]}
     */
    static prepareBatchData (notificationRaw, data, tokens = [], pushTypes = {}, appIds) {
        const notification = WebhookAdapter.validateAndPrepareNotification(notificationRaw)
        const notifications = [] // User can have many Remote Clients. Message is created for the user, so from 1 message there can be many notifications

        tokens.forEach((pushToken) => {
            const pushType = pushTypes?.[pushToken] ?? PUSH_TYPE_DEFAULT
            const preparedData = WebhookAdapter.prepareData(data)
            const pushData = {
                token: pushToken,
                data: {
                    ...preparedData,
                    '_title': notification.title,
                    '_body': notification.body,
                },
                type: pushType,
                appId: get(appIds, pushToken),
            }

            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.app)) notifications.push(pushData)
        })

        return [notifications, {}]
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
     * @param appIds
     * @returns {Promise<null|(boolean|T|{state: string, error: *})[]>}
     */
    async sendNotification ({ notification, data, tokens, pushTypes, appIds } = {}) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [ notifications, pushContext] = WebhookAdapter.prepareBatchData(notification, data, tokens, pushTypes, appIds)

        const notificationsByAppId = {}
        for (const notification of notifications) {
            const appId = notification.appId
            notificationsByAppId[appId] ||= []
            notificationsByAppId[appId].push(notification)
        }

        let successCount = 0
        let failureCount = 0
        const errors = {}

        for (const [appId, notificationsBatchForApp] of Object.entries(notificationsByAppId)) {
            const configForApp = this.#config[appId]
            if (!configForApp) {
                logger.error({ msg: 'unknown appId. Config was not found', data: { appId } })
                failureCount += notificationsBatchForApp.length
                errors[appId] = (errors[appId] || 0) + notificationsBatchForApp.length
                continue
            }

            const secret = configForApp.secret
            const url = configForApp.url
            const requestBody = { notifications: notificationsBatchForApp }

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': secret,
                    },
                    body: JSON.stringify(requestBody),
                })

                if (response.ok) {
                    logger.info({ msg: 'sendNotification success', data: { appId, count: notificationsBatchForApp.length } })
                    successCount += notificationsBatchForApp.length
                } else {
                    let bodyText = ''
                    try {
                        bodyText = await response.text()
                        logger.error({ msg: 'sendNotification bad response', data: { appId, status: response.status } })
                    } catch {
                        logger.error({ msg: 'sendNotification bad response', data: { appId, status: response.status, body: bodyText } })
                    } finally {
                        failureCount += notificationsBatchForApp.length
                        errors[appId] = (errors[appId] || 0) + notificationsBatchForApp.length
                    }
                }
            } catch (err) {
                logger.error({ msg: 'sendNotification error', err, data: { appId } })
                failureCount += notificationsBatchForApp.length
                errors[appId] = (errors[appId] || 0) + notificationsBatchForApp.length
            }
        }

        const isOk = successCount > 0 && failureCount === 0

        const result = {
            successCount,
            failureCount,
            errors,
        }

        return [isOk, { ...result, pushContext }]
    }
}

module.exports = {
    WebhookAdapter,
}