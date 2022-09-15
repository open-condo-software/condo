const { AbstractSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/AbstractSuggestionProvider')
const { GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')

class GoogleSuggestionProvider extends AbstractSuggestionProvider {

    getProviderName () {
        return GOOGLE_PROVIDER
    }

    /**
     * @returns {Promise<Array>}
     */
    async get ({ query, context = null, count = 20 }) {
        return Promise.resolve(['google suggestion 1', 'google suggestion 2'])
    }

    normalize (data) {
        return data
    }

    denormalize (data) {
        return data
    }
}

module.exports = { GoogleSuggestionProvider }
