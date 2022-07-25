const get = require('lodash/get')
const fetch = require('node-fetch')
const conf = require('@core/config')

const FAKE_SUGGESTIONS = (conf['FAKE_ADDRESS_SUGGESTIONS'] && conf['FAKE_ADDRESS_SUGGESTIONS'] === 'true') || false
const addressSuggestionsConfig = conf['ADDRESS_SUGGESTIONS_CONFIG'] && JSON.parse(conf['ADDRESS_SUGGESTIONS_CONFIG'])
const API_URL = get(addressSuggestionsConfig, 'apiUrl', null)
const API_TOKEN = get(addressSuggestionsConfig, 'apiToken', null)

if (!FAKE_SUGGESTIONS && (!API_URL || !API_TOKEN)) {
    throw new Error('FAKE_ADDRESS_SUGGESTIONS env set to false, but no ADDRESS_SUGGESTIONS_CONFIG was provided')
}

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

// TODO(DOMA-3250) Move to common solution after migrating to new suggestion service
async function getRealAddressSuggestions (query, amount) {
    const result = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${API_TOKEN}`,
        },
        body: JSON.stringify(
            {
                query,
                // NOTE: Used search from house to house for preventing results for country only etc.
                // Since we don't need such suggestions on server side
                from_bound: { value: 'house' },
                to_bound: { value: 'house' },
                restrict_value: true,
                count: amount,
            }
        ),
    })
    const status = result.status
    if (status === 200) {
        const response = await result.json()
        return get(response, 'suggestions', [])
    } else {
        return []
    }
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

