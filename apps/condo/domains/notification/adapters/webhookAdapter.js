const jwt = require('jsonwebtoken')
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
                userExternalIdentityIds: [],
                userId: '',
                context: '',
                appId: get(appIds, pushToken),
            }

            if (!APPS_WITH_DISABLED_NOTIFICATIONS.includes(data.app)) notifications.push(pushData)
        })

        return [notifications, {}]
    }

    /**
     * Sends notification via webhook with message type based routing
     * @param {Object} options - Notification options
     * @param {Object} options.notification - Notification data
     * @param {Object} options.data - Additional data including message type
     * @param {Array} options.tokens - Array of push tokens
     * @param {Object} options.pushTypes - Push types for tokens
     * @param {Object} options.appIds - App IDs for tokens
     * @returns {Promise<Array>} [success, result] - Returns [isSuccess, {successCount, failureCount, errors}]
     */
    async sendNotification ({ notification, data, tokens, pushTypes, appIds } = {}) {
        if (!tokens || isEmpty(tokens)) return [false, { error: 'No pushTokens available.' }]

        const [notifications] = WebhookAdapter.prepareBatchData(notification, data, tokens, pushTypes, appIds)

        // Group notifications by appId and message type
        // WEBHOOK_CONFIG_JSON='{"appId": { "urls": [{ "secret": "***", "http://example.com/webhook/ticket", messageTypes: ["TICKET_STATUS_DONE"]}]}}'
        // { "appId": { "TICKET_STATUS_DONE": [<notification1>, <notification2>] } 
        const notificationsByAppAndType = {}
        for (const notification of notifications) {
            const appId = notification.appId
            const messageType = notification.data.type

            if (!notificationsByAppAndType[appId]) {
                notificationsByAppAndType[appId] = {}
            }
            if (!notificationsByAppAndType[appId][messageType]) {
                notificationsByAppAndType[appId][messageType] = []
            }
            notificationsByAppAndType[appId][messageType].push(notification)
        }

        let successCount = 0
        let failureCount = 0
        const errors = {}

        for (const [appId, notificationsByType] of Object.entries(notificationsByAppAndType)) {
            const configForApp = this.#config[appId]

            if (!configForApp) {
                const count = Object.values(notificationsByType).flat().length
                logger.error({ msg: 'Unknown appId. Config was not found', data: { appId } })
                failureCount += count
                errors[appId] = (errors[appId] || 0) + count
                continue
            }

            for (const [messageType, typeNotifications] of Object.entries(notificationsByType)) {
                const webhookConfig = configForApp.urls?.find(urlConfig => urlConfig.messageTypes?.includes(messageType))

                if (!webhookConfig.url) {
                    logger.warn({ msg: 'No webhook URL configured for message type', data: { appId, messageType } })
                    continue
                }

                let body
                if (!webhookConfig.secret) {
                    body = JSON.stringify(typeNotifications)
                } else {
                    body = jwt.sign(typeNotifications, webhookConfig.secret, { algorithm: 'HS256' })
                }

                try {
                    const response = await fetch(webhookConfig.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body,
                    })

                    if (response.ok) {
                        logger.info({
                            msg: 'Webhook notification sent successfully',
                            data: {
                                appId,
                                messageType,
                                count: typeNotifications.length,
                            },
                        })
                        successCount += typeNotifications.length
                    } else {
                        const errorText = await response.text().catch(() => 'Failed to read error response')
                        throw new Error(`HTTP ${response.status}: ${errorText}`)
                    }
                } catch (error) {
                    logger.error({
                        msg: 'Failed to send webhook notification',
                        error: error.message,
                        data: {
                            appId,
                            messageType,
                            url: webhookConfig.url,
                        },
                    })
                    failureCount += typeNotifications.length
                    errors[appId] = (errors[appId] || 0) + typeNotifications.length
                }
            }
        }

        const isOk = successCount > 0 && failureCount === 0

        const result = {
            successCount,
            failureCount,
            errors,
        }

        return [isOk, { ...result }]
    }
}

module.exports = {
    WebhookAdapter,
}