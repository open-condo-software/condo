const { DADATA_PROVIDER, GOOGLE_PROVIDER, PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const {
    getSearchProvider,
    getSuggestionsProvider,
} = require('@address-service/domains/common/utils/services/providerDetectors')
const {
    DadataSearchProvider,
    GoogleSearchProvider,
    PullentiSearchProvider,
} = require('@address-service/domains/common/utils/services/search/providers')
const {
    DadataSuggestionProvider,
    GoogleSuggestionProvider,
    PullentiSuggestionProvider,
} = require('@address-service/domains/common/utils/services/suggest/providers')

describe('Provider detector', () => {

    const originalEnv = process.env

    const providersEligibleConfigs = {
        [DADATA_PROVIDER]: { DADATA_SUGGESTIONS: '{"url":"where is dadata?", "token":"tooooken"}' },
        [GOOGLE_PROVIDER]: { GOOGLE_API_KEY: 'just an api key' },
        [PULLENTI_PROVIDER]: { PULLENTI_CONFIG: '{"url":"the_url"}' },
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
            [PULLENTI_PROVIDER, 'PULLENTI_CONFIG'],
        ]

        test.each(cases)('in the case of %p provider the %p variable must exist', (providerName, variableName) => {
            process.env.PROVIDER = providerName
            delete process.env[variableName]
            expect(getSearchProvider).toThrow(`There is no '${variableName}' in .env.`)
        })
    })

    describe('detects correct search provider', () => {
        const cases = [
            // [<provider name in .env>, <provider name in query>, <provider's class>]
            [DADATA_PROVIDER, undefined, DadataSearchProvider],
            [GOOGLE_PROVIDER, undefined, GoogleSearchProvider],
            [PULLENTI_PROVIDER, undefined, PullentiSearchProvider],
            [undefined, undefined], // No provider set
            ['some string', undefined], // An un-existing provider set
            [DADATA_PROVIDER, PULLENTI_PROVIDER, PullentiSearchProvider],
            [GOOGLE_PROVIDER, PULLENTI_PROVIDER, PullentiSearchProvider],
        ]

        test.each(cases)('for %p', (providerNameInEnv, providerNameInQuery, expected = undefined) => {
            process.env = {
                ...process.env,
                PROVIDER: providerNameInEnv,
                ...(providersEligibleConfigs[providerNameInEnv] || {}),
            }

            const req = {
                id: 'some-uuid',
                query: providerNameInQuery ? { provider: providerNameInQuery } : {},
            }

            if (expected) {
                expect(getSearchProvider({ req })).toBeInstanceOf(expected)
            } else {
                expect(getSearchProvider({ req })).toBeUndefined()
            }
        })
    })

    describe('detects correct search provider from POST body', () => {
        const cases = [
            // [<provider name in req.body>, <provider's class>]
            [DADATA_PROVIDER, DadataSearchProvider],
            [GOOGLE_PROVIDER, GoogleSearchProvider],
            [PULLENTI_PROVIDER, PullentiSearchProvider],
        ]

        test.each(cases)('when req.body.provider is %p', (providerNameInBody, expected) => {
            // Ensure all required configs for providers are present regardless of env PROVIDER
            process.env = {
                ...process.env,
                ...providersEligibleConfigs[DADATA_PROVIDER],
                ...providersEligibleConfigs[GOOGLE_PROVIDER],
                ...providersEligibleConfigs[PULLENTI_PROVIDER],
            }

            const req = {
                id: 'some-uuid',
                query: {},
                body: { provider: providerNameInBody },
            }

            expect(getSearchProvider({ req })).toBeInstanceOf(expected)
        })
    })

    describe('detects correct suggest provider', () => {
        const cases = [
            // [<provider name in .env>, <provider name in query>, <provider's class>]
            [DADATA_PROVIDER, undefined, DadataSuggestionProvider],
            [GOOGLE_PROVIDER, undefined, GoogleSuggestionProvider],
            [PULLENTI_PROVIDER, undefined, PullentiSuggestionProvider],
            [undefined, undefined], // No provider set
            ['abra-shvabra-cadabra', undefined], // An un-existing provider set
            [DADATA_PROVIDER, PULLENTI_PROVIDER, PullentiSuggestionProvider],
            [GOOGLE_PROVIDER, PULLENTI_PROVIDER, PullentiSuggestionProvider],
        ]

        test.each(cases)('for %p', (providerNameInEnv, providerNameInQuery, expected = undefined) => {
            process.env = {
                ...process.env,
                PROVIDER: providerNameInEnv,
                ...(providersEligibleConfigs[providerNameInEnv] || {}),
            }

            const req = {
                id: 'some-uuid',
                query: providerNameInQuery ? { provider: providerNameInQuery } : {},
            }

            if (expected) {
                expect(getSuggestionsProvider({ req })).toBeInstanceOf(expected)
            } else {
                expect(getSuggestionsProvider({ req })).toBeUndefined()
            }
        })
    })
})
