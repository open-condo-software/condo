/**
 * @jest-environment node
 */

const index = require('@app/address-service/index')
const { faker } = require('@faker-js/faker')

const { fetch } = require('@open-condo/keystone/fetch')
const { makeClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { Address, AddressHeuristic, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { generateDadataSuggestionItem } = require('@address-service/domains/address/utils/testSchema/dadataUtils')
const {
    HEURISTIC_TYPE_COORDINATES,
    HEURISTIC_TYPE_FALLBACK,
    HEURISTIC_TYPE_FIAS_ID,
} = require('@address-service/domains/common/constants/heuristicTypes')
const { SearchByProvider } = require('@address-service/domains/common/utils/services/search/plugins/SearchByProvider')
const { StrategyEachItemToPlugins } = require('@address-service/domains/common/utils/services/search/strategies/StrategyEachItemToPlugins')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers')

async function requestApp (client, { method = 'GET', path = '/' }) {
    const response = await fetch(`${client.serverUrl}${path}`, { method })

    return {
        statusCode: response.status,
        body: await response.text(),
    }
}

describe('SearchKeystoneApp', () => {
    setFakeClientMode(index)

    let client
    let godContext
    let mockedDadataSuggestion
    let mockedCallToDadata
    let mockedSuggestionNormalize
    let mockedStrategySearch
    let mockedProcessPluginResult
    let mockedSearchByProvider

    beforeAll(async () => {
        client = await makeClient()
        godContext = await index.keystone.createContext({ skipAccessControl: true })
    })

    beforeEach(() => {
        const city = faker.address.cityName()
        const street = faker.address.street()
        const house = String(faker.datatype.number({ min: 1, max: 999 }))
        const rawAddress = `г ${city}, ул ${street}, д ${house}`
        const unrestrictedValue = `${faker.address.zipCode()}, г ${city}, ул ${street}, д ${house}`

        mockedDadataSuggestion = generateDadataSuggestionItem({
            value: rawAddress,
            unrestricted_value: unrestrictedValue,
        }, {
            city_with_type: `г ${city}`,
            street_with_type: `ул ${street}`,
            house_type: 'д',
            house,
            qc_geo: 0,
            geo_lat: `${faker.datatype.float({ min: 10, max: 80, precision: 0.000001 })}`,
            geo_lon: `${faker.datatype.float({ min: 10, max: 170, precision: 0.000001 })}`,
        })

        mockedCallToDadata = jest.spyOn(DadataSuggestionProvider.prototype, 'callToDadata')
            .mockResolvedValue({ suggestions: [mockedDadataSuggestion] })
        mockedSuggestionNormalize = jest.spyOn(DadataSuggestionProvider.prototype, 'normalize')
        mockedStrategySearch = jest.spyOn(StrategyEachItemToPlugins.prototype, 'search')
        mockedProcessPluginResult = jest.spyOn(StrategyEachItemToPlugins.prototype, 'processPluginResult')
        mockedSearchByProvider = jest.spyOn(SearchByProvider.prototype, 'search')
    })

    afterEach(() => {
        jest.clearAllMocks()
        mockedSearchByProvider.mockRestore()
        mockedProcessPluginResult.mockRestore()
        mockedStrategySearch.mockRestore()
        mockedSuggestionNormalize.mockRestore()
        mockedCallToDadata.mockRestore()
    })

    test('should return 400 when query parameter s is missing for GET /search', async () => {
        const response = await requestApp(client, { path: '/search' })

        expect(response.statusCode).toBe(400)
        expect(mockedStrategySearch).not.toHaveBeenCalled()
    })

    test('should search by rawAddress from /suggest answer', async () => {
        const query = faker.address.city()
        const suggestResponse = await requestApp(client, {
            path: `/suggest?s=${encodeURIComponent(query)}&provider=dadata&context=suggestHouse`,
        })

        expect(suggestResponse.statusCode).toBe(200)
        expect(mockedCallToDadata).toHaveBeenCalledTimes(1)
        expect(mockedSuggestionNormalize).toHaveBeenCalledTimes(1)

        const suggestPayload = JSON.parse(suggestResponse.body)
        const providerSuggestion = suggestPayload.find((item) => item?.provider?.name === 'dadata')
        expect(providerSuggestion).toBeTruthy()

        const rawAddress = providerSuggestion.rawValue
        expect(typeof rawAddress).toBe('string')
        expect(rawAddress.length).toBeGreaterThan(0)

        const searchResponse = await requestApp(client, {
            path: `/search?s=${encodeURIComponent(rawAddress)}&provider=dadata&context=suggestHouse`,
        })

        expect(searchResponse.statusCode).toBe(200)
        expect(mockedStrategySearch).toHaveBeenCalledTimes(1)
        expect(mockedProcessPluginResult).toHaveBeenCalledTimes(1)

        const searchPayload = JSON.parse(searchResponse.body)
        const normalizedRawAddress = rawAddress.toLowerCase()

        expect(searchPayload).toEqual(expect.objectContaining({
            address: mockedDadataSuggestion.value,
            addressKey: expect.any(String),
            addressSources: expect.any(Array),
        }))
        expect(searchPayload.addressSources.some((source) => source.startsWith(normalizedRawAddress))).toBe(true)

        const createdAddress = await Address.getOne(
            godContext,
            { id: searchPayload.addressKey, deletedAt: null },
            'id address key'
        )
        expect(createdAddress).toEqual(expect.objectContaining({
            id: searchPayload.addressKey,
            address: mockedDadataSuggestion.value,
            key: expect.any(String),
        }))

        const createdAddressSources = await AddressSource.getAll(
            godContext,
            { address: { id: searchPayload.addressKey }, deletedAt: null },
            'id source'
        )
        expect(createdAddressSources.length).toBeGreaterThan(0)
        expect(createdAddressSources.some(({ source }) => source.startsWith(normalizedRawAddress))).toBe(true)

        const createdHeuristics = await AddressHeuristic.getAll(
            godContext,
            { address: { id: searchPayload.addressKey }, deletedAt: null },
            'id type value provider'
        )
        expect(createdHeuristics.length).toBeGreaterThan(0)
        expect(createdHeuristics.map(({ type }) => type)).toEqual(expect.arrayContaining([
            HEURISTIC_TYPE_FIAS_ID,
            HEURISTIC_TYPE_COORDINATES,
            HEURISTIC_TYPE_FALLBACK,
        ]))
    })

    test('should not create duplicate records on repeated /search with the same s', async () => {
        const query = faker.address.city()
        const suggestResponse = await requestApp(client, {
            path: `/suggest?s=${encodeURIComponent(query)}&provider=dadata&context=suggestHouse`,
        })

        expect(suggestResponse.statusCode).toBe(200)

        const suggestPayload = JSON.parse(suggestResponse.body)
        const providerSuggestion = suggestPayload.find((item) => item?.provider?.name === 'dadata')
        expect(providerSuggestion).toBeTruthy()

        const rawAddress = providerSuggestion.rawValue
        const searchPath = `/search?s=${encodeURIComponent(rawAddress)}&provider=dadata&context=suggestHouse`

        const firstSearchResponse = await requestApp(client, { path: searchPath })
        expect(firstSearchResponse.statusCode).toBe(200)

        const firstSearchPayload = JSON.parse(firstSearchResponse.body)
        const firstAddressKey = firstSearchPayload.addressKey

        const sourcesAfterFirstSearch = await AddressSource.getAll(
            godContext,
            { address: { id: firstAddressKey }, deletedAt: null },
            'id source'
        )
        const heuristicsAfterFirstSearch = await AddressHeuristic.getAll(
            godContext,
            { address: { id: firstAddressKey }, deletedAt: null },
            'id type value'
        )

        const secondSearchResponse = await requestApp(client, { path: searchPath })
        expect(secondSearchResponse.statusCode).toBe(200)

        const secondSearchPayload = JSON.parse(secondSearchResponse.body)
        expect(secondSearchPayload.addressKey).toBe(firstAddressKey)

        const sourcesAfterSecondSearch = await AddressSource.getAll(
            godContext,
            { address: { id: firstAddressKey }, deletedAt: null },
            'id source'
        )
        const heuristicsAfterSecondSearch = await AddressHeuristic.getAll(
            godContext,
            { address: { id: firstAddressKey }, deletedAt: null },
            'id type value'
        )

        expect(sourcesAfterSecondSearch).toHaveLength(sourcesAfterFirstSearch.length)
        expect(heuristicsAfterSecondSearch).toHaveLength(heuristicsAfterFirstSearch.length)

        const normalizedSourcesAfterFirstSearch = sourcesAfterFirstSearch
            .map(({ id, source }) => `${id}:${source}`)
            .sort()
        const normalizedSourcesAfterSecondSearch = sourcesAfterSecondSearch
            .map(({ id, source }) => `${id}:${source}`)
            .sort()
        expect(normalizedSourcesAfterSecondSearch).toEqual(normalizedSourcesAfterFirstSearch)

        const normalizedHeuristicsAfterFirstSearch = heuristicsAfterFirstSearch
            .map(({ id, type, value }) => `${id}:${type}:${value}`)
            .sort()
        const normalizedHeuristicsAfterSecondSearch = heuristicsAfterSecondSearch
            .map(({ id, type, value }) => `${id}:${type}:${value}`)
            .sort()
        expect(normalizedHeuristicsAfterSecondSearch).toEqual(normalizedHeuristicsAfterFirstSearch)
    })

    test('should return 404 when provider can not find address', async () => {
        mockedCallToDadata.mockResolvedValueOnce({ suggestions: [] })

        const response = await requestApp(client, {
            path: '/search?s=unknown-address&provider=dadata&context=suggestHouse',
        })

        expect(response.statusCode).toBe(404)
        expect(mockedStrategySearch).toHaveBeenCalledTimes(1)
        expect(mockedSearchByProvider).toHaveBeenCalledTimes(1)
    })
})
