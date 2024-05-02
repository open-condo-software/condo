const get = require('lodash/get')

const conf = require('@open-condo/config')

const { AddressServiceClient } = require('./AddressServiceClient')
const { MockedAddressServiceClient } = require('./MockedAddressServiceClient')

let instance

/**
 * @returns {AddressServiceClient|MockedAddressServiceClient}
 */
function createInstance () {
    // TODO(INFRA-314): swap to ADDRESS_SERVICE_DOMAIN after review env ready to create own address-service instances
    const addressServiceUrl = get(conf, 'ADDRESS_SERVICE_URL')

    if (!instance) {
        if (get(conf, 'JEST_MOCKS_ENABLED') === 'true') {
            instance = new MockedAddressServiceClient(addressServiceUrl)
        } else {
            instance = new AddressServiceClient(addressServiceUrl)
        }
    }

    return instance
}

module.exports = { createInstance }
