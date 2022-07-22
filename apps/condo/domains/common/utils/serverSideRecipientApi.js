const get = require('lodash/get')
const fetch = require('node-fetch')
const conf = require('@core/config')


//TODO: add constants in helm
const recipientSuggestionsConfig = conf['RECIPIENT_SUGGESTIONS_CONFIG'] && JSON.parse(conf['RECIPIENT_SUGGESTIONS_CONFIG'])
const API_URL = get(recipientSuggestionsConfig, 'apiUrl', null)
const API_TOKEN = get(recipientSuggestionsConfig, 'apiToken', null)

async function getOrganizationByTin (query) {
    const result = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${API_TOKEN}`,
        },
        body: JSON.stringify({ query: query, branch_type: 'MAIN' }),
    })

    const status = result.status

    if (status === 200) {
        const response = await result.json()
        return get(response, 'suggestions', [])[0]
    } else {
        return []
    }
}

module.exports = {
    getOrganizationByTin,
}

