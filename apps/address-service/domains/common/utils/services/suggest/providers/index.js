const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider')
const { GoogleSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/GoogleSuggestionProvider')
const { PullentiSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/PullentiSuggestionProvider')

module.exports = {
    DadataSuggestionProvider,
    GoogleSuggestionProvider,
    PullentiSuggestionProvider,
}
