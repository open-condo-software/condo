const { get } = require('lodash')
const fetch = require('node-fetch')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const TOKEN_CONFIG = 'DADATA_SUGGESTIONS'
const API_CONFIG_KEY = 'DADATA_API'
const BALANCE_WARNING = 'DADATA_PROFILE_BALANCE_WARNING'
const SUGGESTIONS_WARNING = 'DADATA_SUGGESTIONS_LIMIT_WARNING'

class DadataHealthChecker {
    #isInitialized

    constructor () {
        const tokenConfig = JSON.parse(get(conf, TOKEN_CONFIG, '{}'))
        const apiConfig = JSON.parse(get(conf, API_CONFIG_KEY, '{}'))
        this.logger = getLogger(this.constructor.name)

        this.#isInitialized = Boolean(tokenConfig.token && apiConfig.url && apiConfig.secret)

        if (this.#isInitialized) {
            this.url = apiConfig.url
            this.token = tokenConfig.token
            this.secret = apiConfig.secret
            this.profileBalanceWarning = get(conf, BALANCE_WARNING, 0)
            this.suggestionsWarning = get(conf, SUGGESTIONS_WARNING, 1000)
        }
    }

    /**
     * @private
     * @return {{Authorization: string, 'X-Secret': any, 'Content-Type': string}}
     */
    getRequestHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.token}`,
        'X-Secret': this.secret,
    })

    /**
     * @private
     * @param apiRequestPromise {Promise<fetch>}
     * @return {Promise<boolean>}
     */
    async makeHealthcheckRequest (apiRequestPromise) {
        if (!this.#isInitialized) {
            console.warn('Healthcheck config not initialized properly, return ok as fallback')
            return true
        }

        try {
            const result = await apiRequestPromise

            if (result.status !== 200) return false

            return await result.json()
        } catch (error) {
            this.logger.warn({
                msg: 'Got error while execute healthcheck request', error,
            })
            return false
        }
    }

    /**
     * Checks token balance.
     * In case of returned value less than DADATA_PROFILE_BALANCE_WARNING or any unhandled error -> returns false
     * Otherwise returns true
     * @return {Promise<boolean>}
     */
    async profileBalance () {
        const profileBalanceRequest = fetch(this.url + '/profile/balance', { method: 'GET', headers: this.getRequestHeaders() })

        const response = await this.makeHealthcheckRequest(profileBalanceRequest)

        return get(response, 'balance', 0) > this.profileBalanceWarning
    }

    /**
     * Checks token daily statistics of suggestions usage
     * Returns false in case of any unhandled error or if remaining suggestions count less than
     * @return {Promise<boolean>}
     */
    async dailyStatistics () {
        const dailyStatisticsRequest = fetch(this.url + '/stat/daily', { method: 'GET', headers: this.getRequestHeaders() })

        const response = await this.makeHealthcheckRequest(dailyStatisticsRequest)

        return get(response, ['remaining', 'suggestions'], 0) > this.suggestionsWarning
    }
}

module.exports = {
    DadataHealthChecker,
}
