const get = require('lodash/get')

const conf = require('@open-condo/config')
const { AddressServiceClient } = require('@open-condo/keystone/plugins/utils/address-service-client/AddressServiceClient')
const { MockedAddressServiceClient } = require('@open-condo/keystone/plugins/utils/address-service-client/MockedAddressServiceClient')

let instance

/**
 * Singleton. Returns the client instance
 * @param {string} url The URL of the address service
 * @returns {AddressServiceClient}
 */

function createRealInstance (url) {
    if (!instance) {
        instance = new AddressServiceClient(url)
    }

    return instance
}

function createTestInstance (existingItem = null) {
    // In the case of testing, we must return a new instance every time because all tests have a unique context.
    return new MockedAddressServiceClient(existingItem)
}

/**
 * @param {Object} testItem
 * @returns {MockedAddressServiceClient|AddressServiceClient}
 */
function createInstance (testItem) {
    return conf.NODE_ENV === 'test' || get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake'
        ? createTestInstance(testItem)
        : createRealInstance(get(conf, 'ADDRESS_SERVICE_URL'))
}

module.exports = { createInstance }
