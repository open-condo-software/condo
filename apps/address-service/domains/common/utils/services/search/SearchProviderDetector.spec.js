const {
    DadataSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const { SearchProviderDetector } = require('@address-service/domains/common/utils/services/search/SearchProviderDetector')
const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')

describe('Search provider detector', () => {

    const providerDetector = new SearchProviderDetector()

    describe('detects correct provider', () => {
        const cases = [
            [DADATA_PROVIDER, DadataSearchProvider],
            ['ru', DadataSearchProvider],
            [undefined, DadataSearchProvider],
            ['some string', DadataSearchProvider],
        ]

        test.each(cases)('for %p - is %p', (geo, expected) => {
            expect(providerDetector.getProvider(geo)).toBeInstanceOf(expected)
        })
    })
})
