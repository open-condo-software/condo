const { DADATA_PROVIDER, GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const {
    getSearchProvider,
    getSuggestionsProvider,
} = require('@address-service/domains/common/utils/services/providerDetectors')
const {
    DadataSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const {
    DadataSuggestionProvider,
    GoogleSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')

describe('Search provider detector', () => {

    describe('detects correct search provider', () => {
        const cases = [
            [DADATA_PROVIDER, DadataSearchProvider],
            ['ru', DadataSearchProvider],
            [undefined, DadataSearchProvider],
            ['some string', DadataSearchProvider],
        ]

        test.each(cases)('for %p - is %p', (geo, expected) => {
            expect(getSearchProvider(geo)).toBeInstanceOf(expected)
        })
    })

    describe('detects correct suggest provider', () => {
        const cases = [
            [DADATA_PROVIDER, DadataSuggestionProvider],
            [GOOGLE_PROVIDER, GoogleSuggestionProvider],
            ['ru', DadataSuggestionProvider],
            [undefined, DadataSuggestionProvider],
            ['abra-shvabra-cadabra', DadataSuggestionProvider],
        ]

        test.each(cases)('for %p - is %p', (geo, expected) => {
            expect(getSuggestionsProvider(geo)).toBeInstanceOf(expected)
        })
    })
})
