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
 * @typedef {Object} ProviderDetectorArgs
 * @property {IncomingMessage & {id: String}} [req] Express request object
 */

/**
 * @param {ProviderDetectorArgs} args
 * @returns {AbstractSearchProvider}
 */
function getSearchProvider (args) {
    const provider = get(conf, 'PROVIDER')

    /** @type {AbstractSearchProvider} */
    let searchProvider

    switch (provider) {
        case DADATA_PROVIDER:
            searchProvider = new DadataSearchProvider(args)
            break
        case GOOGLE_PROVIDER:
            searchProvider = new GoogleSearchProvider(args)
            break
    }

    return searchProvider
}

/**
 * @param {ProviderDetectorArgs} args
 * @returns {AbstractSuggestionProvider}
 */
function getSuggestionsProvider (args) {
    const provider = get(conf, 'PROVIDER')

    /** @type {AbstractSuggestionProvider} */
    let suggestionProvider

    switch (provider) {
        case GOOGLE_PROVIDER:
            suggestionProvider = new GoogleSuggestionProvider(args)
            break
        case DADATA_PROVIDER:
            suggestionProvider = new DadataSuggestionProvider(args)
            break
    }

    return suggestionProvider
}

module.exports = { getSearchProvider, getSuggestionsProvider }
