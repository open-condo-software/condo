const {
    DadataSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const { DADATA_PROVIDER, GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const {
    GoogleSuggestionProvider,
    DadataSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')

/**
 * @param {string} geo 'ru'|'en'|'dadata'|'google'|'<some city name>'|...
 * @returns {AbstractSearchProvider}
 */
function getSearchProvider (geo) {
    /** @type {AbstractSearchProvider} */
    let searchProvider
    switch (geo) {
        // In some cases, we need to force choose one of the providers.
        // To achieve this, we give an ability to pass a particular provider name
        case DADATA_PROVIDER:
        case 'ru':
            searchProvider = new DadataSearchProvider()
            break
        case GOOGLE_PROVIDER:
        default:
            //TODO(AleX83Xpert) always return dadata provider till the google's one will be ready
            searchProvider = new DadataSearchProvider()
    }

    return searchProvider
}

/**
 * @param {string} geo
 * @returns {AbstractSuggestionProvider}
 */
function getSuggestionsProvider (geo) {
    /** @type {AbstractSuggestionProvider} */
    let suggestionProvider
    switch (geo) {
        // In some cases, we need to force choose one of the providers.
        // To achieve this, we give an ability to pass a particular provider name
        case GOOGLE_PROVIDER:
            suggestionProvider = new GoogleSuggestionProvider()
            break
        case DADATA_PROVIDER:
        case 'ru':
            suggestionProvider = new DadataSuggestionProvider()
            break
        default:
            suggestionProvider = new DadataSuggestionProvider()
    }

    return suggestionProvider
}

module.exports = { getSearchProvider, getSuggestionsProvider }
