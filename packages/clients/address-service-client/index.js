const get = require('lodash/get')

const conf = require('@open-condo/config')

const { AddressServiceClient } = require('./AddressServiceClient')

let instance

/**
 * @returns {MockedAddressServiceClient|AddressServiceClient}
 */
function createInstance () {
    const addressServiceUrl = get(conf, 'ADDRESS_SERVICE_DOMAIN')

    if (!instance) {
        instance = new AddressServiceClient(addressServiceUrl)
    }

    return instance
}

module.exports = { createInstance }
