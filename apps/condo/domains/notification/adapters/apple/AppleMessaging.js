const { isEmpty, get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const { PUSH_TYPE_SILENT_DATA } = require('@condo/domains/notification/constants/constants')

const { AppleJSONWebToken } = require('./AppleJSONWebToken')
const AppleSession = require('./AppleSession')
const {
    UNKNOWN_STATUS,
    ERRORS,
    APS_PUSH_TYPE_ALERT,
    APS_PUSH_TYPE_VOIP,
    APS_PUSH_TYPE_BACKGROUND,
    APS_RESPONSE_STATUS_SUCCESS,
    RETRY_RESTRICTION,
} = require('./constants')

const logger = getLogger()

class AppleMessaging {
    #token = null
    #session = null

    /**
     * @param config
     */
    constructor (config) {
        this.#token = new AppleJSONWebToken(config)
        this.#session = new AppleSession(config.url)
        this.getResponseHandler = this.getResponseHandler.bind(this)
        this.sendPush = this.sendPush.bind(this)
    }

    getResponseHandler (stream, resolve, reject) {
        const reqErrorHandler = error => {
            stream.close()
            this.#session.errorHandler(error)
        }

        return (headers, flags) => {
            const handleStreamData = (...args) => {
                const status = get(headers, ':status', UNKNOWN_STATUS)
                const apnsId = get(headers, 'apns-id', null)
                const json = chunks.join('')
                let data

                if (json) {
                    try {
                        data = JSON.parse(json)
                    } catch (error) {
                        logger.error({ msg: 'response JSON parse error', err: error, data: { headers, json } })
                        data = { error }
                    }
                }

                if (status === APS_RESPONSE_STATUS_SUCCESS) {
                    resolve({ apnsId, data, json, args, status, headers, flags })
                } else {
                    let error
                    let errorText = ERRORS[status] || `Remote server responded with error code ${status}`

                    if (errorText) {
                        error = new Error(errorText)
                        error.reason = get(data, 'reason')
                        error['apns-id'] = apnsId
                    } else {
                        error = new Error(`Remote server responded with error code ${status}`)
                    }

                    const payload = { apnsId, data, json, args, status, headers, flags }
                    const errorContents = {
                        msg: `Remote server responded with error code ${status}`,
                        err: error,
                        data: payload,
                    }

                    logger.error(errorContents)
                    reject(error)
                }
            }

            const chunks = []
            const handleDataChunks = chunk => { chunks.push(chunk) }

            stream.on('aborted', reqErrorHandler)
            stream.on('data', handleDataChunks)
            stream.on('end', handleStreamData)
        }
    }

    /**
     * Sends a new push notification via the APNS service
     * The method uses the APNS service in a stateless manner making use of a short lived
     * HTTP/2 session.
     *
     * @param  {string} pushToken
     * @param  {object} payload
     * @param  {object} options
     *
     * @return {Promise} A promise that resolves if the request is successful or rejects
     * with an error
     */
    sendPush (pushToken, payload, options = {}) {
        return new Promise((resolve, reject) => {
            if (!payload) return reject(Error('Parameter `payload` is required'))
            if (!pushToken) return reject(Error('Parameter `pushToken` is required'))

            const buffer = Buffer.from(JSON.stringify(payload))
            const headers = {
                ':path': `/3/device/${pushToken}`,
                ':method': 'POST',
                'Authorization': `bearer ${this.#token.value}`,
                'apns-push-type': APS_PUSH_TYPE_ALERT,
                'apns-topic': options.appId,
                'Content-Type': 'application/json',
                'Content-Length': buffer.length,
            }

            if (!isEmpty(options)) {
                if (options.id) headers['apns-id'] = options.id
                if (options.expiration) headers['apns-expiration'] = options.expiration
                if (options.priority) headers['apns-priority'] = options.priority
                if (options.collapseId) headers['apns-collapse-id'] = options.collapseId
                if (options.type) headers['apns-push-type'] = options.type
                if (options.type === APS_PUSH_TYPE_VOIP) headers['apns-topic'] = `${options.appId}.voip`
            }

            logger.info({ msg: 'sendPush before request', data: { headers, options, payload } })

            const stream = this.#session.request(headers)

            stream.on('response', this.getResponseHandler(stream, resolve, reject))
            stream.on('error', (err) => {
                logger.error({ msg: 'sendPush errored', err, data: { headers, options, payload } })
                return resolve(err)
            })
            stream.write(buffer)
            stream.end()
        })
    }

    async sendAll (notifications, isVoIP = false ) {
        const responses = []
        let successCount = 0, failureCount = 0

        const promises = await Promise.allSettled(notifications.map(async (_, idx) => {
            const { token, data: pushData = {}, notification = {}, aps = {}, type, appId } = notifications[idx]
            const options = { appId }
            const payload = {
                aps: { ...aps },
                ...pushData,
            }

            if (isVoIP) {
                options.type = APS_PUSH_TYPE_VOIP
                payload.aps.alert = { ...notification }
            } else if (type === PUSH_TYPE_SILENT_DATA) {
                options.type = APS_PUSH_TYPE_BACKGROUND
                payload.aps['content-available'] = 1
            } else {
                payload.aps.alert = { ...notification }
            }

            let response
            try {
                for (let retryCounter = 0; retryCounter < RETRY_RESTRICTION; retryCounter++) {
                    response = await this.sendPush(token, payload, options)
                    if (response instanceof Error) {
                        logger.warn({
                            msg: 'sendPush was not successful',
                            count: retryCounter + 1,
                            err: response,
                        })
                        continue
                    }
                    break
                }
            } catch (error) {
                logger.error({
                    msg: 'sendPush fail',
                    err: error,
                })
                response = { error }
            }
            return response
        }))

        for (const p of promises) {
            if (p.status !== 'fulfilled') {
                responses.push({ error: p.reason })
                failureCount += 1
                continue
            }
            
            const responseValue = p.value
            responses.push(responseValue)

            if (responseValue instanceof Error) {
                failureCount += 1
            } else {
                const status = get(responseValue, ['headers', ':status'])

                if (status === APS_RESPONSE_STATUS_SUCCESS) {
                    successCount += 1
                } else {
                    failureCount += 1
                }
            }
        }

        return { responses, successCount, failureCount }
    }
}

module.exports = AppleMessaging
