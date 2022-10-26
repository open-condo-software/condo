const {
    DadataSuggestionProvider,
    GoogleSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')
const { SuggestionProviderDetector } = require('@address-service/domains/common/utils/services/suggest/SuggestionProviderDetector')
const { DADATA_PROVIDER, GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')

describe('Suggestions provider detector', () => {

    const providerDetector = new SuggestionProviderDetector()

    describe('detects correct provider', () => {
        const cases = [
            [DADATA_PROVIDER, DadataSuggestionProvider],
            [GOOGLE_PROVIDER, GoogleSuggestionProvider],
            ['ru', DadataSuggestionProvider],
            [undefined, GoogleSuggestionProvider],
            ['abra-shvabra-cadabra', GoogleSuggestionProvider],
        ]

        test.each(cases)('for %p - is %p', (geo, expected) => {
            expect(providerDetector.getProvider(geo)).toBeInstanceOf(expected)
        })
    })
})
