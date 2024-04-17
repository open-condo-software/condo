const get = require('lodash/get')

const conf = require('@open-condo/config')

const { AddressServiceClient: MockedClient } = require('./__mocks__/AddressServiceClient')
const { AddressServiceClient } = require('./AddressServiceClient')

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
