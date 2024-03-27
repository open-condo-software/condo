const get = require('lodash/get')

const conf = require('@open-condo/config')

const { AddressServiceClient } = require('./AddressServiceClient')
const { MockedAddressServiceClient } = require('./MockedAddressServiceClient')

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
    const addressServiceUrl = get(conf, 'ADDRESSSERVICE_DOMAIN')
    return addressServiceUrl && get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') !== 'fake'
        ? createRealInstance(addressServiceUrl)
        : createTestInstance(testItem)
}

module.exports = { createInstance }
