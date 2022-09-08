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
     * @param {AddressServiceParams?} params Additional parameters
     */
    constructor (url, params) {
        const { geo = null, count = 20, context = null } = params

        if (!url) {
            throw new Error('The `url` parameter is mandatory')
        }

        this.url = url

        // The next fields allow to define some query parameters for all queries made by this client instance
        this.geo = geo
        this.count = count
        this.context = context
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

        const urlParams = [`s=${s}`]

        Object.keys(params).forEach((paramName) => {
            const paramValue = params[paramName] || this[paramName] || null
            if (paramValue) {
                urlParams.push(`${paramName}=${paramValue}`)
            }
        })

        return this.call(`${this.url}/suggest?${urlParams.join('&')}`)
    }

    async search () {
        throw new Error('The method is not implemented yet')
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
