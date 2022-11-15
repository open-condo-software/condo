const {
    DadataSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const { DADATA_PROVIDER, GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')

class SearchProviderDetector {

    /**
     * @param {string} geo
     * @returns {AbstractSearchProvider}
     */
    getProvider (geo) {
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
}

module.exports = { SearchProviderDetector }
