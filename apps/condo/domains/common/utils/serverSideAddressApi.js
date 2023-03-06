const conf = require('@open-condo/config')
const { createInstance: createAddressServiceClientInstance } = require('@open-condo/keystone/plugins/utils/address-service-client')

const FAKE_SUGGESTIONS = (conf['FAKE_ADDRESS_SUGGESTIONS'] && conf['FAKE_ADDRESS_SUGGESTIONS'] === 'true') || false

async function getFakeAddressSuggestions (query, amount) {
    const parts = query.split(', ')
    const begin = parts.slice(0, -3)
    const [cityPart, streetPart, housePart] = parts.slice(-3)
    let [houseType, houseNumber, ...rest] = (housePart || '').split(' ')
    houseNumber = parseInt(houseNumber || '1')
    if (isNaN(houseNumber)) houseNumber = 1
    const suggestions = []
    for (let i = houseNumber; i < houseNumber + amount; i++) {
        const lastPart = [houseType, i, ...rest].join(' ')
        suggestions.push({
            value: [...begin, cityPart, streetPart, lastPart].join(', '),
            data: {
                house_type_full: houseType === 'д' ? 'дом' : houseType || 'house',
            },
        })
    }

    return suggestions
}

async function getRealAddressSuggestions (query, amount) {
    const addressServiceClient = createAddressServiceClientInstance({ address: query })

    return await addressServiceClient.suggest(query, { context: 'serverSide', count: amount }) || []
}

async function getAddressSuggestions (query, amount) {
    if (FAKE_SUGGESTIONS) {
        return await getFakeAddressSuggestions(query, amount)
    }

    return await getRealAddressSuggestions(query, amount)
}

module.exports = {
    getAddressSuggestions,
}

