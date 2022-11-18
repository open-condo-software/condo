const {
    DadataSuggestionProvider,
    GoogleSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')
const { DADATA_PROVIDER, GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')

class SuggestionProviderDetector {

    /**
     * @param {string} geo
     * @returns {AbstractSuggestionProvider}
     */
    getProvider (geo) {
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
}

module.exports = { SuggestionProviderDetector }
