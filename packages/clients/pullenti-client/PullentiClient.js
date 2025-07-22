const { fetch } = require('@open-condo/keystone/fetch')

/**
 * @typedef {Object} PullentiClientOptions
 * @property {function(string): any} [processor] Optional processor for the XML response
 */

/**
 * @typedef {any} PullentiClientProcessorResultType
 */

/**
 * @typedef {string|PullentiClientProcessorResultType} PullentiClientResultType
 */

class PullentiClient {

    /**
     * @param {string} url The address service url (root)
     * @param {PullentiClientOptions} [options] Optional parameters
     */
    constructor (url, options = {}) {
        if (!url) {
            throw new Error('The `url` parameter is mandatory')
        }
        
        const { processor = null } = options

        this.url = url
        this.processor = processor
    }

    /**
     * Makes a POST request to the Pullenti service with the provided body.
     * @param {string} body The XML body to send in the request
     * @returns {Promise<PullentiClientResultType>} The response text from the Pullenti service
     * @throws {Error} If the request fails or the response is not OK
     * @private
     */
    async callToPullenti (body) {
        const response = await fetch(this.url, {
            method: 'POST',
            body,
        })

        if (response.ok) {
            const text = await response.text()
            if (this.processor) {
                try {
                    return this.processor(text)
                } catch (err) {
                    throw new Error('Failed to process the result', { cause: err })
                }
            }
            return text
        }

        throw new Error(`Failed to fetch from Pullenti. Status ${response.status}. StatusText: ${response.statusText}`)
    }

    /**
     * Builds an XML part for the maximum count of results.
     * If count is NaN or not a number, it returns an empty string.
     * @param {number | NaN} count 
     * @returns {string} The XML part for maxcount or an empty string
     * @private
     */
    buildMaxCountXmlPart (count) {
        if (count && typeof count === 'number') {
            return `<maxcount>${count}</maxcount>`
        }
        return ''
    }

    /**
     * Escapes XML special characters to prevent XML injection
     * @param {string} str The string to escape
     * @returns {string} The escaped string
     * @private
     */
    escapeXml (str) {
        if (typeof str !== 'string') {
            return String(str)
        }
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    /**
     * @param {string} param
     * @param {string} value
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByParam (param, value) {
        const escapedParam = this.escapeXml(param)
        const escapedValue = this.escapeXml(value)
        const body = `<SearchObjects><searchparams><paramtype>${escapedParam}</paramtype><paramvalue>${escapedValue}</paramvalue></searchparams></SearchObjects>`
        return await this.callToPullenti(body)
    }

    /**
     * Makes attempt to extract address parts from the given string and to connect extracted parts with gar objects.
     * @param {string} address The address to processing
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async processAddress (address) {
        const escapedAddress = this.escapeXml(address)
        return await this.callToPullenti(`<ProcessSingleAddressText>${escapedAddress}</ProcessSingleAddressText>`)
    }

    /**
     * @param {string} text
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByText (text, { count } = {}) {
        const escapedText = this.escapeXml(text)
        return await this.callToPullenti(`<SearchObjects><searchparams><text>${escapedText}</text>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * @param {string} area
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByArea (area, { count } = {}) {
        const escapedArea = this.escapeXml(area)
        return await this.callToPullenti(`<SearchObjects><searchparams><area>${escapedArea}</area>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * @param {string} city
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByCity (city, { count } = {}) {
        const escapedCity = this.escapeXml(city)
        return await this.callToPullenti(`<SearchObjects><searchparams><city>${escapedCity}</city>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * @param {string} street
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByStreet (street, { count } = {}) {
        const escapedStreet = this.escapeXml(street)
        return await this.callToPullenti(`<SearchObjects><searchparams><street>${escapedStreet}</street>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * Searches for objects by GUID.
     * @param {string} guid
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByGuid (guid) {
        return await this.searchByParam('guid', guid)
    }

    /**
     * Searches for objects by object ID.
     * @param {string} objectId
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByObjectId (objectId) {
        return await this.searchByParam('objectid', objectId)
    }

    /**
     * Searches for objects by Pullenti ID.
     * @param {any} pullentiId
     * @returns {Promise<PullentiClientResultType>} The response from the Pullenti service
     */
    async searchByPullentiId (pullentiId) {
        const escapedId = this.escapeXml(pullentiId)
        return await this.callToPullenti(`<GetObject>${escapedId}</GetObject>`)
    }
}

module.exports = { PullentiClient }
