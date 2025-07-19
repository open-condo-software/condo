const { get } = require('lodash')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
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

        return new Proxy(this, {
            get (target, property) {
                const originalMethod = target[property]

                if (typeof originalMethod === 'function') {
                    return (...args) => {
                        if (!target.#isInitialized) {
                            console.warn('Healthcheck config not initialized properly, return fail as fallback')
                            return false
                        }

                        return originalMethod.apply(target, args)
                    }
                }
            },
        })
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
     * @return {Promise<{intermediateResult: Boolean, originalResponse: Object | null}>}
     */
    async makeHealthcheckRequest (apiRequestPromise) {
        try {
            const result = await apiRequestPromise

            if (result.status !== 200) return { intermediateResult: false, originalResponse: null }

            const originalResponse = await result.json()

            return { intermediateResult: true, originalResponse }
        } catch (err) {
            this.logger.warn({
                msg: 'got error while execute healthcheck request',
                err,
            })
            return { intermediateResult: false, originalResponse: null }
        }
    }

    /**
     * Checks token balance.
     * In case of returned value less than DADATA_PROFILE_BALANCE_WARNING or any unhandled error -> returns false
     * Otherwise returns true
     * @return {Promise<('pass'|'warn'|'fail')>}
     */
    async profileBalance () {
        const profileBalanceRequest = fetch(this.url + '/profile/balance', { method: 'GET', headers: this.getRequestHeaders() })

        const response = await this.makeHealthcheckRequest(profileBalanceRequest)

        if (response.intermediateResult) {
            return get(response, ['originalResponse', 'balance'], 0) > this.profileBalanceWarning ? 'pass' : 'warn'
        }

        return response.intermediateResult ? 'pass' : 'fail'
    }

    /**
     * Checks token daily statistics of suggestions usage
     * Returns false in case of any unhandled error or if remaining suggestions count less than
     * @return {Promise<('pass'|'warn'|'fail')>}
     */
    async dailyStatistics () {
        const dailyStatisticsRequest = fetch(this.url + '/stat/daily', { method: 'GET', headers: this.getRequestHeaders() })

        const response = await this.makeHealthcheckRequest(dailyStatisticsRequest)

        if (response.intermediateResult) {
            return get(response, ['originalResponse', 'remaining', 'suggestions'], 0) > this.suggestionsWarning
                ? 'pass'
                : 'warn'
        }

        return response.intermediateResult ? 'pass' : 'fail'
    }
}

module.exports = {
    DadataHealthChecker,
}
