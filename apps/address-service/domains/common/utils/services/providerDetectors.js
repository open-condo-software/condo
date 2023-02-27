const get = require('lodash/get')

const conf = require('@open-condo/config')

const { DADATA_PROVIDER, GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const {
    DadataSearchProvider,
    GoogleSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const {
    GoogleSuggestionProvider,
    DadataSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')

/**
 * @returns {AbstractSearchProvider}
 */
function getSearchProvider () {
    const provider = get(conf, 'PROVIDER')

    /** @type {AbstractSearchProvider} */
    let searchProvider

    switch (provider) {
        case DADATA_PROVIDER:
            searchProvider = new DadataSearchProvider()
            break
        case GOOGLE_PROVIDER:
            searchProvider = new GoogleSearchProvider()
            break
    }

    return searchProvider
}

/**
 * @returns {AbstractSuggestionProvider}
 */
function getSuggestionsProvider () {
    const provider = get(conf, 'PROVIDER')

    /** @type {AbstractSuggestionProvider} */
    let suggestionProvider

    switch (provider) {
        case GOOGLE_PROVIDER:
            suggestionProvider = new GoogleSuggestionProvider()
            break
        case DADATA_PROVIDER:
            suggestionProvider = new DadataSuggestionProvider()
            break
    }

    return suggestionProvider
}

module.exports = { getSearchProvider, getSuggestionsProvider }
