const { createInstance } = require('@open-condo/clients/address-service-client')

/**
 * @deprecated you should use `@open-condo/keystone/plugins/utils/address-service-client`
 */
async function getAddressSuggestions (query, amount) {
    const addressServiceClient = createInstance({ address: query })
    return await addressServiceClient.suggest(query, { context: 'serverSide', count: amount }) || []
}

module.exports = {
    getAddressSuggestions,
}

