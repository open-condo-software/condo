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

    async fetchAdvanceAcceptances ({ clientId, date }) {
        const params = qs.stringify({ clientId, date })
        const path = `${this.advanceAcceptancesPath}?${params}`
        const result = await this.request({
            method: 'GET',
            path,
            body: { clientId, date },
        })
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