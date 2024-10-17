const get = require('lodash/get')

const conf = require('@open-condo/config')

const { AddressServiceClient } = require('./AddressServiceClient')
const { FakeAddressServiceClient } = require('./FakeAddressServiceClient')

let instance

/**
 * @returns {AddressServiceClient|FakeAddressServiceClient}
 */
function createInstance () {
    // TODO(INFRA-314): swap to ADDRESS_SERVICE_DOMAIN after review env ready to create own address-service instances
    const addressServiceUrl = get(conf, 'ADDRESS_SERVICE_URL')

    if (!instance) {
        if (get(conf, 'FAKE_ADDRESS_SERVICE_CLIENT') === 'true') {
            console.log('🥸 The fake AddressServiceClient is used.')
            instance = new FakeAddressServiceClient(addressServiceUrl)
        } else {
            instance = new AddressServiceClient(addressServiceUrl)
        }
    }

    return instance
}

module.exports = { createInstance }
