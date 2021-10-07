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
 * Advance acceptance record, returned by Fintech API
 *
 * @typedef AdvanceAcceptance
 * @property {String} payerInn
 * @property {String} payerAccount
 * @property {String} payerBankBic
 * @property {String} payerBankCorrAccount
 * @property {String} purpose
 * @property {String} payerOrgIdHash
 * @property {String} payerName
 * @property {String} sinceDate
 * @property {String} untilDate
 * @property {Boolean} active
 * @property bundles
 * @example
 * {"payerInn":"5034800639","payerAccount":"40702810840147579127","payerBankBic":"044525225","payerBankCorrAccount":"30101810400000000225","purpose":"оплата подпики за сервис по договору ХХХ от 22.22.2222","payerOrgIdHash":"340f51b2defe28355c0655febc03ac26b7f78b07f0be7704ec2ec1cdb5905e4c","payerName":"ООО \"ПАРТНЕР-626\"","sinceDate":"2021-10-07","untilDate":null,"active":true,"bundles":null}
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
     * @return {Promise<AdvanceAcceptance[]|FintechErrorResponse>}
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