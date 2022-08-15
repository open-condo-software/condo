const {
    DadataSuggestionProvider,
    GoogleSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')

class SuggestionProviderDetector {

    /**
     * @param {string} geo
     * @returns {AbstractSuggestionProvider}
     */
    getProvider (geo) {
        /** @type {AbstractSuggestionProvider} */
        let suggestionProvider
        switch (geo) {
            case 'dadata':
            case 'ru':
                suggestionProvider = new DadataSuggestionProvider()
                break
            case 'google':
            default:
                suggestionProvider = new GoogleSuggestionProvider()
        }

        return suggestionProvider
    }
}

module.exports = { SuggestionProviderDetector }
