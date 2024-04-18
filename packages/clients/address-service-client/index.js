const get = require('lodash/get')

const { AddressServiceClient } = require('@open-condo/clients/address-service-client/AddressServiceClient')
const { MockedAddressServiceClient } = require('@open-condo/clients/address-service-client/MockedAddressServiceClient')
const conf = require('@open-condo/config')

let instance

/**
 * @returns {AddressServiceClient|MockedAddressServiceClient}
 */
function createInstance () {
    const addressServiceUrl = get(conf, 'ADDRESS_SERVICE_DOMAIN')

    if (!instance) {
        if (get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake') {
            instance = new MockedAddressServiceClient(addressServiceUrl)
        } else {
            instance = new AddressServiceClient(addressServiceUrl)
        }
    }

    return instance
}

module.exports = { createInstance }
