const conf = require('@condo/config')
const { AddressServiceClient } = require('@condo/address-service-client/AddressServiceClient')
const { MockedAddressServiceClient } = require('@condo/address-service-client/MockedAddressServiceClient')

let instance

/**
 * Singleton. Returns the client instance
 * @param {string} url The URL of the address service
 * @param {AddressServiceParams?} params
 * @returns {AddressServiceClient}
 */
function createInstance (url, params) {
    if (!instance) {
        instance = conf.NODE_ENV === 'test'
            ? new MockedAddressServiceClient()
            : new AddressServiceClient(url, params)
    }

    return instance
}

module.exports = { createInstance }
