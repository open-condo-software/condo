const get = require('lodash/get')
const fetch = require('node-fetch')
const conf = require('@condo/config')

const bankAccountSuggestionsConfig = conf['BANK_ACCOUNT_SUGGESTIONS_CONFIG'] && JSON.parse(conf['BANK_ACCOUNT_SUGGESTIONS_CONFIG'])
const API_URL_BANK = get(bankAccountSuggestionsConfig, 'apiUrlBank', null)
const API_TOKEN = get(bankAccountSuggestionsConfig, 'apiToken', null)

async function getBankByRoutingNumber (query) {
    const result = await fetch(API_URL_BANK, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${API_TOKEN}`,
        },
        body: JSON.stringify({ query: query }),
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
    getBankByRoutingNumber,
}
