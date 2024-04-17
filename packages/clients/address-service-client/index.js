const get = require('lodash/get')

const { AddressServiceClient: MockedClient } = require('@open-condo/clients/address-service-client/__mocks__/AddressServiceClient')
const { AddressServiceClient } = require('@open-condo/clients/address-service-client/AddressServiceClient')
const conf = require('@open-condo/config')

let instance

/**
 * @returns {AddressServiceClient}
 */
function createInstance () {
    const addressServiceUrl = get(conf, 'ADDRESS_SERVICE_DOMAIN')

    if (!instance) {
        if (get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake') {
            instance = new MockedClient(addressServiceUrl)
        } else {
            instance = new AddressServiceClient(addressServiceUrl)
        }
    }

    return instance
}

module.exports = { createInstance }
