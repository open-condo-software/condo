const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { DADATA_PROVIDER, GOOGLE_PROVIDER, PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const {
    DadataSearchProvider,
    GoogleSearchProvider,
    PullentiSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const {
    GoogleSuggestionProvider,
    DadataSuggestionProvider,
    PullentiSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')

const logger = getLogger()

/**
 * @typedef {Object} ProviderDetectorArgs
 * @property {IncomingMessage & {id: String}} [req] Express request object
 */

/**
 * @param {ProviderDetectorArgs} args
 * @returns {AbstractSearchProvider|undefined}
 */
function getSearchProvider (args) {
    const provider = args?.req?.query?.provider || args?.req?.body?.provider || get(conf, 'PROVIDER')

    /** @type {AbstractSearchProvider|undefined} */
    let searchProvider

    switch (provider) {
        case DADATA_PROVIDER:
            searchProvider = new DadataSearchProvider(args)
            break
        case GOOGLE_PROVIDER:
            searchProvider = new GoogleSearchProvider(args)
            break
        case PULLENTI_PROVIDER:
            searchProvider = new PullentiSearchProvider(args)
            break
    }

    return searchProvider
}

/**
 * @param {ProviderDetectorArgs} args
 * @returns {AbstractSuggestionProvider|undefined}
 */
function getSuggestionsProvider (args) {
    const provider = args?.req?.query?.provider || args?.req?.body?.provider || get(conf, 'PROVIDER')

    /** @type {AbstractSuggestionProvider|undefined} */
    let suggestionProvider

    switch (provider) {
        case GOOGLE_PROVIDER:
            suggestionProvider = new GoogleSuggestionProvider(args)
            break
        case DADATA_PROVIDER:
            suggestionProvider = new DadataSuggestionProvider(args)
            break
        case PULLENTI_PROVIDER:
            suggestionProvider = new PullentiSuggestionProvider(args)
            break
    }

    return suggestionProvider
}

module.exports = { getSearchProvider, getSuggestionsProvider }
