const qs = require('qs')
const { get } = require('lodash')
const { SbbolRequestApi } = require('./SbbolRequestApi')
const { SBBOL_API_RESPONSE } = require('./common')

/**
 * Error reponse from Fintech API
 * @typedef {Object} FintechErrorResponse
 * @property {string} cause
 * @property {string} referenceId
 * @property {string} message
 * @example
 * {"cause":"DATA_NOT_FOUND_EXCEPTION","referenceId":"dc32b274-7943-4f2d-ab4c-dc75ea1272bc","message":"Не найдено ни одного заранее данного акцепта за указанную дату"}
 */

/**
 * Offers access to only some set of methods
 * Requires separate `clientId` and secret (differs from authentication)
 */
class SbbolFintechApi extends SbbolRequestApi {

    /**
     * Fetches changes in subscription for given date.
     * According to official comments from Fintech API representatives, `/v1/partner-info/advance-acceptances` method returns data **changes** only for current day.
     * It does not just returns all subscriptions for services of our organization, It's even not possible ;)
     * If active subscriptions are present in response, then it means, that offer was accepted at given date.
     * If not active subscriptions are present, then it means, that offer was declined at given date.
     *
     * @param date
     * @param clientId
     * @return {Promise<*[]|any>}
     */
    async fetchAdvanceAcceptances ({ date, clientId }) {
        const jsonResultString = await this.request({
            method: 'GET',
            path: this.advanceAcceptancesPath,
            body: { clientId, date },
        })
        const result = JSON.parse(jsonResultString)
        if (get(result, 'cause') === SBBOL_API_RESPONSE.DATA_NOT_FOUND_EXCEPTION) {
            return []
        }
        if (!Array.isArray(result)) {
            console.error('Cannot parse advanceAcceptances')
            return []
        }
        return result
    }

    get advanceAcceptancesPath () {
        return `${this.apiPrefix}/v1/partner-info/advance-acceptances`
    }

    get apiPrefix () {
        return '/fintech/api'
    }
}

module.exports = {
    SbbolFintechApi,
}