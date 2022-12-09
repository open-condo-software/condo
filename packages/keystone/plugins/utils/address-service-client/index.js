const { AddressServiceClient } = require('@open-condo/keystone/plugins/utils/address-service-client/AddressServiceClient')
const { MockedAddressServiceClient } = require('@open-condo/keystone/plugins/utils/address-service-client/MockedAddressServiceClient')

let instance

/**
 * Singleton. Returns the client instance
 * @param {string} url The URL of the address service
 * @returns {AddressServiceClient}
 */
function createInstance (url) {
    if (!instance) {
        instance = new AddressServiceClient(url)
    }

    return instance
}

function createTestInstance (existingItem = null) {
    // In the case of testing, we must return a new instance every time because all tests have a unique context.
    return new MockedAddressServiceClient(existingItem)
}

module.exports = { createInstance, createTestInstance }
