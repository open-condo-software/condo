const { get, isArray, isString, isEmpty, cloneDeep } = require('lodash')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const HCMAuth = require('./auth')
const { URGENCY_NORMAL, TOKEN_TIMEOUT_ERROR, SUCCESS_CODES } = require('./constants')
const { validateMessage } = require('./validators')

const ENDPOINT = 'https://push-api.cloud.huawei.com/v1'
const ANDROID_PAYLOAD_KEY = 'android'
const DEFAULT_ANDROID_PAYLOAD = Object.freeze({
    [ANDROID_PAYLOAD_KEY]: {
        urgency: URGENCY_NORMAL,
        ttl: '10000s',
    },
})

const logger = getLogger()

/**
 * HCM - Huawei Cloud Messaging
 *
 * Requests HCM to send push notifications
 */
class HCMMessaging {
    config = null
    authClient = null

    constructor (conf) {
        this.config = conf
        this.authClient = new HCMAuth(conf)
    }

    async send (rawMessage, validationOnly = false) {

        // TODO (@toplenboren) DOMA-10611 remove excessive logging
        logger.info({ msg: 'HCMMessaging send', data: { args: { rawMessage, validationOnly } } })

        if (!this.authClient) throw new Error('can\'t refresh token because getting auth client fail')
        if (!this.authClient.token || this.authClient.isExpired) await this.authClient.refreshToken()

        const payload = JSON.parse(JSON.stringify(rawMessage))

        if (!isArray(payload.token)) payload.token = [payload.token]
        if (!isEmpty(payload.data) && !isString(payload.data)) payload.data = JSON.stringify(payload.data)

        const defaultAndroidPayload = cloneDeep(DEFAULT_ANDROID_PAYLOAD)

        const message = {
            ...defaultAndroidPayload,
            token: payload.token,
        }
        if (!isEmpty(payload.notification)) message[ANDROID_PAYLOAD_KEY].notification = payload.notification
        if (!isEmpty(payload.data)) message[ANDROID_PAYLOAD_KEY].data = payload.data

        const request = { validate_only: validationOnly, message }
        const result = await this.#sendRequest(request)

        if (result.code === TOKEN_TIMEOUT_ERROR) {
            await this.authClient.refreshToken()

            const result2 = await this.#sendRequest(request)

            return result2
        }

        return result
    }

    async #sendRequest (body) {
        // TODO (@toplenboren) DOMA-10611 remove excessive logging
        logger.info({ msg: 'HCMMessaging sendRequest', data: { args: { body } } })

        validateMessage(body.message)

        const url = `${ENDPOINT}/${this.config.clientId}/messages:send`
        const headers = {
            'Content-Type': 'application/json;charset=utf-8',
            Authorization: `Bearer ${this.authClient.token}`,
        }

        let response, json

        const requestBody = JSON.stringify(body)

        // TODO (@toplenboren) DOMA-10611 remove excessive logging
        logger.info({ msg: 'HCMMessaging sendRequest, data is ready:', data: { args: { requestBody } } })

        try {
            response = await fetch(url, { method: 'POST', body: requestBody, headers })
            json = await response.json()
        } catch (error) {
            logger.error({ msg: 'send push notification request error', err: error })
        }

        const responseCode = get(json, 'code')

        // https://developer.huawei.com/consumer/en/doc/development/HMSCore-References/https-send-api-0000001050986197#section13968115715131
        if (!(get(response, 'status') === 200 && responseCode && SUCCESS_CODES.includes(responseCode))) {
            logger.error({ msg: 'HCMMessaging sendRequest error', url, data: { body, headers, response: json } })
        }

        return json
    }
}

module.exports = HCMMessaging
