const { isEmpty, get } = require('lodash')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const { getCurrTimeStamp } = require('@condo/domains/common/utils/date')

const ENDPOINT = 'https://oauth-login.cloud.huawei.com/oauth2/v3/token'

const logger = getLogger()

/**
 * HCM - Huawei Cloud Messaging
 *
 * Retrieves access token from Huawei using app credentials and manages it's freshness
 */
class HСMAuth {
    config = null
    #token = null
    #expires = null

    constructor (conf) {
        this.config = conf
    }

    get token () {
        if (this.isExpired) return null

        return this.#token
    }

    get isExpired () {
        return isEmpty(this.#token) || this.#expires && getCurrTimeStamp() >= this.#expires
    }

    async refreshToken (force = false) {
        // when !force and already have a token and it's not expired, return it
        if (!force && !isEmpty(this.token) && !this.isExpired) return this.token

        // TODO(akarjakin): store access token into Redis

        const url = this.config.authUrl ? this.config.authUrl : ENDPOINT
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
        const body = `grant_type=client_credentials&client_id=${this.config.clientId}&client_secret=${this.config.secret}`

        let response, json

        try {
            response = await fetch(url, { method: 'POST', body, headers })
            json = await response.json()
        } catch (error) {
            logger.info({ msg: 'access token request error', err: error })
        }

        if (get(response, 'status') === 200) {
            this.#token = json.access_token
            this.#expires = getCurrTimeStamp() + json.expires_in - 5
        } else {
            logger.info({ msg: 'access token request error', data: { response: json } })
        }

        return this.#token
    }
}

module.exports = HСMAuth