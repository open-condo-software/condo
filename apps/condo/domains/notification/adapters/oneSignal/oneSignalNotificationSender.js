const OneSignal = require('@onesignal/node-onesignal')
const z = require('zod')

const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const { PUSH_TYPE_SILENT_DATA } = require('@condo/domains/notification/constants/constants')

const HIGHEST_PRIORITY = 10
const APNS_PUSH_TYPE_OVERRIDE_VOIP = 'voip'
const TARGET_CHANNEL = 'push'



const CONFIG_SCHEMA = z.object({
    providerAppId: z.string(),
    apiKey: z.string(),
})

class OneSignalNotificationSender {
    /** @type {import('@onesignal/node-onesignal').DefaultApi} */
    _app
    providerAppId
    
    constructor (config) {
        const { success, data: parsedConfig, error } = CONFIG_SCHEMA.safeParse(config)
        if (!success) {
            throw new AggregateError([
                Error('OneSignalNotificationSender config is invalid'),
                error,
            ])
        }
        const oneSignalConfiguration = OneSignal.createConfiguration({ restApiKey: parsedConfig.apiKey })
        this._app = new OneSignal.DefaultApi(oneSignalConfiguration)
        this.providerAppId = parsedConfig.providerAppId
    }

    /**
     * @param notification {import('@onesignal/node-onesignal').Notification}
     * @returns {Promise<{
     * notification: import('@onesignal/node-onesignal').Notification,
     * response?: import('@onesignal/node-onesignal').CreateNotificationSuccessResponse,
     * error?: Error
     * }>}
     */
    async sendPush (notification) {
        try {
            notification.idempotency_key ??= generateUUIDv4()
            return { notification, response: await this._app.createNotification(notification) }
        } catch (err) {
            return { notification, error: err }
        }
    }

    /**
     * @param notifications
     * @param isVoIP
     * @returns {Promise<{responses: {token: string, success: boolean, response: import('@onesignal/node-onesignal').CreateNotificationSuccessResponse | null, error?: Error}[], successCount: number, failureCount: number}>}
     */
    async sendAll (notifications, isVoIP = false) {
        const responses = []
        let successCount = 0, failureCount = 0

        const providerNotificationsObjects = this._buildPayloadsForProvider(notifications, isVoIP)

        const promises = await Promise.allSettled(providerNotificationsObjects.map(async (providerNotificationsObject) => {
            return await this.sendPush(providerNotificationsObject)
        }))

        for (const p of promises) {
            if (p.status !== 'fulfilled') {
                responses.push({ error: p.reason })
                failureCount += 1
                continue
            }
            /** @type {import('@onesignal/node-onesignal').CreateNotificationSuccessResponse} */
            const { notification, response, error } = p.value
            if (error) {
                responses.push(...notification.include_subscription_ids.map(token => ({
                    token,
                    success: false,
                    response,
                    error,
                })))
                failureCount += notification.include_subscription_ids.length
            } else {
                const didSendMessageToSomebody = !!response.id

                if (didSendMessageToSomebody) {
                    const surelyNonSuccessTokens = (response.errors?.invalid_player_ids ?? [])

                    responses.push(...notification.include_subscription_ids.map(token => {
                        const success = !surelyNonSuccessTokens.includes(token)
                        return {
                            token,
                            success,
                            response,
                        }
                    }))
                    successCount += notification.include_subscription_ids.length - surelyNonSuccessTokens.length
                    failureCount += surelyNonSuccessTokens.length
                } else {
                    responses.push(...notification.include_subscription_ids.map(token => ({
                        token,
                        success: false,
                        response,
                    })))
                    failureCount += notification.include_subscription_ids.length
                }
            }
        }

        return { responses, successCount, failureCount }
    }

    /**
     * Dedupes notifications by their content and builds payloads for provider
     * @param notifications
     * @param isVoIP
     * @returns {Notification[]}
     * @private
     */
    _buildPayloadsForProvider (notifications, isVoIP) {
        const sameNotificationForMultipleTokensByBody = {}
        notifications.forEach(notification => {
            const body = { data: notification.data, notification: notification.notification, type: notification.type }
            const bodyStringified = JSON.stringify(body)
            if (!sameNotificationForMultipleTokensByBody[bodyStringified]) sameNotificationForMultipleTokensByBody[bodyStringified] = {
                data: notification.data,
                notification: notification.notification,
                type: notification.type,
                tokens: [],
            }
            sameNotificationForMultipleTokensByBody[bodyStringified].tokens.push(notification.token)
        })

        return Object.values(sameNotificationForMultipleTokensByBody).map(({ tokens, type, data, notification }) => {
            const providerNotification = new OneSignal.Notification()

            providerNotification.app_id = this.providerAppId
            providerNotification.include_subscription_ids = tokens
            providerNotification.data = data
            providerNotification.target_channel = TARGET_CHANNEL
            providerNotification.mutable_content = true

            if (type === PUSH_TYPE_SILENT_DATA) {
                providerNotification.content_available = true
            } else {
                providerNotification.headings = { en: notification.title } // NOTE(YEgorLu): provide only one language, it will be used for everyone
                providerNotification.contents = { en: notification.body } // NOTE(YEgorLu): provide only one language, it will be used for everyone
            }

            if (isVoIP) {
                providerNotification.apns_push_type_override = APNS_PUSH_TYPE_OVERRIDE_VOIP
                providerNotification.priority = HIGHEST_PRIORITY
            }

            return providerNotification
        })
    }

}

module.exports = { OneSignalNotificationSender }