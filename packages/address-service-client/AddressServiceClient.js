const fetch = require('node-fetch')

let instance

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
     * @param {AddressServiceParams?} params Additional parameters. Ability to set query parameters for all queries
     */
    constructor (url, params = {}) {
        if (!url) {
            throw new Error('The `url` parameter is mandatory')
        }

        this.url = url

        // The next fields allow to define some query parameters for all queries made by this client instance
        const { geo = null, count = 20, context = null } = params

        this.possibleUrlParams = {
            // Force queries to dadata until other providers will be ready
            // todo(nas): put the `geo` variable back after other providers be ready
            geo: 'dadata',
            count,
            context,
        }
    }

    /**
     * @param {AddressServiceParams} params
     * @returns {string}
     * @private
     */
    urlifyParams (params) {
        const urlParams = []
        Object.keys(this.possibleUrlParams).forEach((paramName) => {
            const paramValue = params[paramName] || this.possibleUrlParams[paramName] || null
            if (paramValue) {
                urlParams.push(`${paramName}=${paramValue}`)
            }
        })

        return urlParams.join('&')
    }

    /**
     * @param {string} url just url to call
     * @returns {Promise<*>}
     * @private
     */
    async call (url) {
        const result = await fetch(url)
        const status = result.status
        if (status === 200) {
            return await result.json()
        } else {
            //TODO(nas) need to log erroneous status
            return []
        }
    }

    /**
     * @param {string} s The string to search suggestions by
     * @param {AddressServiceParams?} params
     * @returns {Promise<*>}
     * @public
     */
    async suggest (s, params) {
        if (!s) {
            throw new Error('The `s` parameter is mandatory')
        }

        const urlParams = [`s=${s}`, this.urlifyParams(params)].filter(Boolean)

        return this.call(`${this.url}/suggest?${urlParams.join('&')}`)
    }

    /**
     *
     * @param {string} s
     * @param {AddressServiceParams?} params
     * @returns {Promise<*>}
     * @public
     */
    async search (s, params = {}) {
        if (!s) {
            throw new Error('The `s` parameter is mandatory')
        }

        const urlParams = [`s=${s}`, this.urlifyParams(params)].filter(Boolean)

        return this.call(`${this.url}/search?${urlParams.join('&')}`)
    }
}

/**
 * Singleton. Returns the client instance
 * @param {string} url The URL of the address service
 * @param {AddressServiceParams?} params
 * @returns {AddressServiceClient}
 */
function createInstance (url, params) {
    if (!instance) {
        instance = new AddressServiceClient(url, params)
    }

    return instance
}

module.exports = { AddressServiceClient, createInstance }
