/**
 * @typedef {Object} SuggestionHelpersType
 * @property {string} tin The organization's tin (inn)
 */

/**
 * @typedef {Object} AddressServiceParams
 * @property {string?} geo
 * @property {number?} count Number of results to return (20 by default)
 * @property {string?} context
 */

/**
 *
 */
class AddressServiceClient {
    /**
     * @param {string} url The address service url (root)
     */
    constructor (url) {
        if (!url) {
            throw new Error('The `url` parameter is mandatory')
        }

        this.url = url
    }

    /**
     * @param {string} url just url to call
     * @param {Object} body post-data
     * @param {'GET'|'POST'} method query type
     * @returns {Promise<*>}
     * @private
     */
    async call (url, method = 'GET', body = undefined) {
        const params = {
            method,
            headers: {
                'Accept': 'application/json',
            },
        }

        if (method === 'POST' && !!body) {
            params.body = JSON.stringify(body)
            params.headers = {
                ...params.headers,
                'Content-Type': 'application/json',
            }
        }

        const result = await fetch(url, params)
        const status = result.status
        if (status === 200) {
            return await result.json()
        } else {
            //TODO(AleX83Xpert) maybe need to log erroneous status
            return null
        }
    }

    /**
     * @typedef {Object} AddressServiceSuggestHelpersParams
     * @property {string} tin The organization's tin (inn)
     */

    /**
     * @typedef {Object} AddressServiceSuggestParams
     * @property {number} [count]
     * @property {boolean} [bypass]
     * @property {string} [context]
     * @property {AddressServiceSuggestHelpersParams} [helpers]
     */

    /**
     * @param {string} s The string to search suggestions by
     * @param {AddressServiceSuggestParams} [params]
     * @returns {Promise<*>}
     * @public
     */
    async suggest (s, params = {}) {
        if (!s) {
            throw new Error('The `s` parameter is mandatory')
        }

        return this.call(`${this.url}/suggest`, 'POST', { s, ...params })
    }

    /**
     * @typedef {Object} AddressServiceSearchParams
     * @property {string} [geo]
     * @property {string} [context]
     */

    /**
     * @param {string} s
     * @param {AddressServiceSearchParams} [params]
     * @returns {Promise<*>}
     * @public
     */
    async search (s, params = {}) {
        if (!s) {
            throw new Error('The `s` parameter is mandatory')
        }

        const urlParams = new URLSearchParams({ s, ...params }).toString()

        return this.call(`${this.url}/search?${urlParams}`)
    }

    async bulkSearch (params = {}) {
        return this.call(`${this.url}/bulkSearch`, 'POST', params)
    }
}

module.exports = { AddressServiceClient }
