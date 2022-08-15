const { AbstractSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/AbstractSuggestionProvider')

class GoogleSuggestionProvider extends AbstractSuggestionProvider {
    /**
     * @returns {Promise<Array>}
     */
    async call ({ query, isServerSide = false, count = 20 }) {
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
