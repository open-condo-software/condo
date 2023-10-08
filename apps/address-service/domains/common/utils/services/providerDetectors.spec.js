const { DADATA_PROVIDER, GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const {
    getSearchProvider,
    getSuggestionsProvider,
} = require('@address-service/domains/common/utils/services/providerDetectors')
const {
    DadataSearchProvider,
    GoogleSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const {
    DadataSuggestionProvider,
    GoogleSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')

describe('Provider detector', () => {

    const originalEnv = process.env

    const providersEligibleConfigs = {
        [DADATA_PROVIDER]: { DADATA_SUGGESTIONS: '{"url":"where is dadata?", "token":"tooooken"}' },
        [GOOGLE_PROVIDER]: { GOOGLE_API_KEY: 'just an api key' },
    }

    beforeEach(() => {
        jest.resetModules() // clear the cache
        process.env = { ...originalEnv }
    })

    afterAll(() => {
        process.env = originalEnv
    })

    describe('throws an error if there is no config variable for provider', () => {
        const cases = [
            // [<provider name>, <env variable name>]
            [DADATA_PROVIDER, 'DADATA_SUGGESTIONS'],
            [GOOGLE_PROVIDER, 'GOOGLE_API_KEY'],
        ]

        test.each(cases)('in the case of %p provider the %p variable must exist', (providerName, variableName) => {
            process.env.PROVIDER = providerName
            delete process.env[variableName]
            expect(getSearchProvider).toThrow(`There is no '${variableName}' in .env.`)
        })
    })

    describe('detects correct search provider', () => {
        const cases = [
            // [<provider name>, <provider's class>, <env variable name for the provider>, <env variable value for the provider>]
            [DADATA_PROVIDER, DadataSearchProvider],
            [GOOGLE_PROVIDER, GoogleSearchProvider],
            [undefined], // No provider set
            ['some string'], // An un-existing provider set
        ]

        test.each(cases)('for %p', (providerName, expected = undefined) => {
            process.env = {
                ...process.env,
                PROVIDER: providerName,
                ...(providersEligibleConfigs[providerName] || {}),
            }
            if (expected) {
                expect(getSearchProvider({ req: { id: 'some-uuid' } })).toBeInstanceOf(expected)
            } else {
                expect(getSearchProvider({ req: { id: 'some-uuid' } })).toBeUndefined()
            }
        })
    })

    describe('detects correct suggest provider', () => {
        const cases = [
            [DADATA_PROVIDER, DadataSuggestionProvider],
            [GOOGLE_PROVIDER, GoogleSuggestionProvider],
            [undefined], // No provider set
            ['abra-shvabra-cadabra'], // An un-existing provider set
        ]

        test.each(cases)('for %p', (providerName, expected = undefined) => {
            process.env = {
                ...process.env,
                PROVIDER: providerName,
                ...(providersEligibleConfigs[providerName] || {}),
            }
            if (expected) {
                expect(getSuggestionsProvider()).toBeInstanceOf(expected)
            } else {
                expect(getSuggestionsProvider()).toBeUndefined()
            }
        })
    })
})
