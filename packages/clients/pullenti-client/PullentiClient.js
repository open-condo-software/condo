const { fetch } = require('@open-condo/keystone/fetch')

class PullentiClient {

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
     * Makes a POST request to the Pullenti service with the provided body.
     * @param {string} body The XML body to send in the request
     * @returns {Promise<string>} The response text from the Pullenti service
     * @throws {Error} If the request fails or the response is not OK
     * @private
     */
    async callToPullenti (body) {
        const response = await fetch(this.url, {
            method: 'POST',
            body,
        })

        if (response.ok) {
            return await response.text()
        }

        throw new Error(`Failed to fetch from Pullenti: ${response.statusText}`)
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
     * @param {string} param
     * @param {string} value
     */
    async searchByParam (param, value) {
        const body = `<SearchObjects><searchparams><paramtype>${param}</paramtype><paramvalue>${value}</paramvalue></searchparams></SearchObjects>`
        return await this.callToPullenti(body)
    }

    /**
     * @param {string} address
     */
    async searchByAddress (address) {
        return await this.callToPullenti(`<ProcessSingleAddressText>${address}</ProcessSingleAddressText>`)
    }

    /**
     * @param {string} text
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<string>} The response from the Pullenti service
     */
    async searchByText (text, { count }) {
        return await this.callToPullenti(`<SearchObjects><searchparams><text>${text}</text>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * @param {string} area
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<string>} The response from the Pullenti service
     */
    async searchByArea (area, { count }) {
        return await this.callToPullenti(`<SearchObjects><searchparams><area>${area}</area>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * @param {string} city
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<string>} The response from the Pullenti service
     */
    async searchByCity (city, { count }) {
        return await this.callToPullenti(`<SearchObjects><searchparams><city>${city}</city>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * @param {string} street
     * @param {Object} options
     * @param {number} options.count The maximum number of results to return
     * @returns {Promise<string>} The response from the Pullenti service
     */
    async searchByStreet (street, { count }) {
        return await this.callToPullenti(`<SearchObjects><searchparams><street>${street}</street>${this.buildMaxCountXmlPart(count)}</searchparams></SearchObjects>`)
    }

    /**
     * Searches for objects by GUID.
     * @param {string} guid
     * @returns {Promise<string>} The response from the Pullenti service
     */
    async searchByGuid (guid) {
        return await this.searchByParam('guid', guid)
    }

    /**
     * Searches for objects by object ID.
     * @param {string} objectId
     * @returns {Promise<string>} The response from the Pullenti service
     */
    async searchByObjectId (objectId) {
        return await this.searchByParam('objectid', objectId)
    }

    /**
     * Searches for objects by Pullenti ID.
     * @param {any} pullentiId
     * @returns {Promise<string>} The response from the Pullenti service
     */
    async searchByPullentiId (pullentiId) {
        return await this.callToPullenti(`<GetObject>${pullentiId}</GetObject>`)
    }
}

module.exports = { PullentiClient }
