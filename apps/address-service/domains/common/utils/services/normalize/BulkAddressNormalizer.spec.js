const { createInstance } = require('@open-condo/clients/pullenti-client')

const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider')

const { formatDadataHouse } = require('./addressParts')
const { BulkAddressNormalizer } = require('./BulkAddressNormalizer')
const { readBulkNormalizeRequest } = require('./bulkNormalizeInput')
const { getSourceKey } = require('./bulkNormalizeStore')

jest.mock('@open-condo/clients/pullenti-client', () => ({ createInstance: jest.fn() }))
jest.mock('@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider', () => ({
    DadataSuggestionProvider: jest.fn(),
}))

const ADDRESS_ID = 'f231be1b-6920-4c62-904f-6de216a3975b'
const HOUSE_GUID = 'a06eb7a2-18e4-4d0d-8193-6c1cddcc1274'
const OTHER_GUID = '8d84d693-4716-4bc6-9c44-01e1919a25a5'
const HOUSE = 'г Тула, ул Ленина, д 12, к 2'

function makeDadataHouse (guid, data = {}) {
    return {
        value: HOUSE,
        data: {
            country: 'Россия',
            country_iso_code: 'RU',
            city: 'Тула',
            city_with_type: 'г Тула',
            street: 'Ленина',
            street_with_type: 'ул Ленина',
            house_type: 'д',
            house: '12',
            block_type: 'к',
            block: '2',
            house_fias_id: guid,
            fias_id: guid,
            fias_actuality_state: '0',
            ...data,
        },
    }
}

function makePullentiAddress (unit) {
    return {
        coef: 100,
        items: [
            { level: 'City', normal: 'г. Тула' },
            { level: 'Street', normal: 'ул. Ленина' },
            { level: 'Building', normal: 'д 12, к 2', gars: [{ id: 'building', actual: true, objectIds: [42] }] },
            ...(unit ? [{ level: 'Apartment', normal: unit }] : []),
        ],
    }
}

function makeSavedAddress (suggestion = makeDadataHouse(HOUSE_GUID)) {
    return {
        id: ADDRESS_ID,
        address: formatDadataHouse(suggestion.data),
        key: `fias_id:${suggestion.data.house_fias_id}`,
        meta: { data: suggestion.data },
    }
}

describe('BulkAddressNormalizer', () => {
    let pullenti, dadata, store

    function normalize (items, helpers = {}) {
        const controller = new AbortController()
        const normalizer = new BulkAddressNormalizer({
            req: { id: 'test' },
            store,
            helpers,
            signal: controller.signal,
            deadline: Date.now() + 10000,
            limits: { pullenti: 10, fias: 6, dadata: 6, resolve: 10, persist: 3, providerTimeout: 1000 },
        })
        return normalizer.normalize(Object.entries(items))
    }

    beforeEach(() => {
        const providerPath = '@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider'
        const actualProvider = jest.requireActual(providerPath).DadataSuggestionProvider
        pullenti = {
            processAddressJson: jest.fn().mockResolvedValue(null),
            searchByGuidJson: jest.fn().mockResolvedValue([]),
            getGarObjectParams: jest.fn().mockResolvedValue({ guid: [HOUSE_GUID] }),
        }
        dadata = {
            getAddressSuggestions: jest.fn().mockResolvedValue([makeDadataHouse(HOUSE_GUID)]),
            getOrganization: jest.fn().mockResolvedValue(null),
            normalize: actualProvider.prototype.normalize,
        }
        store = {
            findBySource: jest.fn().mockResolvedValue(null),
            findByGuid: jest.fn().mockResolvedValue([]),
            persist: jest.fn().mockResolvedValue(makeSavedAddress()),
        }
        createInstance.mockReturnValue(pullenti)
        DadataSuggestionProvider.mockReturnValue(dadata)
    })

    test('resolves one house for many units and keeps leading zeros', async () => {
        pullenti.processAddressJson.mockImplementation(raw => Promise.resolve(makePullentiAddress(raw.split(', ').pop())))
        const items = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [
            `${HOUSE}, кв ${String(index).padStart(3, '0')}`,
            {},
        ]))

        const result = await normalize(items, { tin: '7707083893' })

        expect(Object.values(result.items)).toHaveLength(100)
        expect(result.items[`${HOUSE}, кв 001`]).toEqual({
            result: { id: ADDRESS_ID, house: HOUSE, globalId: HOUSE_GUID, unitName: '001', unitType: 'flat', confidence: 80 },
            warnings: [],
            error: null,
        })
        expect(dadata.getOrganization).toHaveBeenCalledTimes(1)
        expect(pullenti.getGarObjectParams).toHaveBeenCalledTimes(1)
        expect(dadata.getAddressSuggestions).toHaveBeenCalledTimes(1)
        expect(store.persist).toHaveBeenCalledTimes(1)
    })

    test('checks the explicit corpus when Pullenti fails', async () => {
        pullenti.processAddressJson.mockRejectedValue(new Error('timeout'))
        dadata.getAddressSuggestions
            .mockResolvedValueOnce([makeDadataHouse(OTHER_GUID, { block: null })])
            .mockResolvedValueOnce([makeDadataHouse(OTHER_GUID, { block: null }), makeDadataHouse(HOUSE_GUID)])

        const { items } = await normalize({ [HOUSE]: {} })

        expect(items[HOUSE].result).toMatchObject({ globalId: HOUSE_GUID, unitName: null, unitType: null })
        expect(items[HOUSE].warnings).toEqual(['PULLENTI_UNAVAILABLE'])
        expect(dadata.getAddressSuggestions).toHaveBeenCalledTimes(2)
        expect(store.persist).toHaveBeenCalledTimes(1)
        expect(store.persist).toHaveBeenCalledWith(expect.objectContaining({ guid: HOUSE_GUID }))
    })

    test('does not combine explicit unit number with the type of a different unit', async () => {
        pullenti.processAddressJson.mockResolvedValue(makePullentiAddress('оф. 7'))
        const input = `${HOUSE}, кв. 001`
        const { items } = await normalize({ [input]: { addressMeta: { unitName: '001' } } })
        expect(items[input].result).toMatchObject({ unitName: '001', unitType: 'flat' })
    })

    test('falls back to exact DaData lookup for UUID-only input during a Pullenti outage', async () => {
        pullenti.searchByGuidJson.mockRejectedValue(new Error('timeout'))
        const { items } = await normalize({ [HOUSE_GUID]: { addressMeta: { globalId: `${HOUSE_GUID.toUpperCase()},кв 001` } } })
        expect(items[HOUSE_GUID].result).toMatchObject({ globalId: HOUSE_GUID, unitName: '001', unitType: 'flat' })
        expect(items[HOUSE_GUID].warnings).toEqual(['PULLENTI_UNAVAILABLE'])
        expect(dadata.getAddressSuggestions).toHaveBeenCalledWith(expect.objectContaining({ query: HOUSE_GUID, byId: true }))
        expect(pullenti.processAddressJson).not.toHaveBeenCalled()
    })

    test('returns the right corpus and a warning for an active UUID of a different house', async () => {
        dadata.getAddressSuggestions.mockImplementation(({ byId }) => Promise.resolve(byId
            ? [makeDadataHouse(OTHER_GUID, { block: null })]
            : [makeDadataHouse(HOUSE_GUID)]))
        const input = `${HOUSE}, кв 001`

        const { items } = await normalize({ [input]: { addressMeta: { globalId: `${OTHER_GUID},оф 7` } } })

        expect(items[input].result).toMatchObject({ globalId: HOUSE_GUID, unitName: '001', unitType: 'flat' })
        expect(items[input].warnings).toEqual(['CONFLICTING_ADDRESS_AND_FIAS'])
        expect(store.persist).toHaveBeenCalledTimes(1)
        expect(store.persist).toHaveBeenCalledWith(expect.objectContaining({ guid: HOUSE_GUID }))
    })

    test('uses the parent of a FIAS apartment and suggests replacing the input UUID', async () => {
        pullenti.searchByGuidJson.mockResolvedValue([{ level: 'Apartment', actual: true }])
        dadata.getAddressSuggestions.mockResolvedValue([makeDadataHouse(HOUSE_GUID, { flat_fias_id: OTHER_GUID })])

        const { items } = await normalize({ [OTHER_GUID]: {} })

        expect(items[OTHER_GUID].result).toMatchObject({ globalId: HOUSE_GUID })
        expect(items[OTHER_GUID].warnings).toEqual(['BAD_FIAS'])
    })

    test('preserves an unverified UUID and rejects a suggestion for a different street', async () => {
        const input = `${HOUSE}, кв. 001`
        dadata.getAddressSuggestions.mockImplementation(({ byId }) => Promise.resolve(byId
            ? []
            : [makeDadataHouse(HOUSE_GUID, { street_with_type: 'пер Ленина' })]))

        const { items } = await normalize({ [input]: { addressMeta: { globalId: OTHER_GUID } } })

        expect(items[input].result).toBeNull()
        expect(items[input].error.code).toBe('ADDRESS_NOT_FOUND')
        expect(items[input].warnings).toEqual([])
        expect(store.persist).not.toHaveBeenCalled()
    })

    test('treats provider errors separately from an empty result', async () => {
        dadata.getAddressSuggestions.mockRejectedValue(new Error('timeout'))
        const { items } = await normalize({ [HOUSE]: {} })
        expect(items[HOUSE].error.code).toBe('PROVIDER_UNAVAILABLE')
    })

    test('passes the winning legacy Address to persistence', async () => {
        const legacyAddress = { ...makeSavedAddress(), key: 'fallback:legacy' }
        store.findBySource.mockResolvedValue(legacyAddress)
        const { items } = await normalize({ [HOUSE]: { addressMeta: { globalId: HOUSE_GUID } } })

        expect(items[HOUSE].result.id).toBe(ADDRESS_ID)
        expect(store.persist).toHaveBeenCalledWith(expect.objectContaining({ existingAddress: legacyAddress }))
    })

    test('does not merge distinct existing Address ids discovered for one FIAS', async () => {
        const first = HOUSE
        const second = HOUSE.replace('ул Ленина', 'улица Ленина')
        store.findBySource
            .mockResolvedValueOnce(makeSavedAddress())
            .mockResolvedValueOnce({ ...makeSavedAddress(), id: 'ea427acd-0881-4db6-9189-200b66420370' })

        const { items } = await normalize({ [first]: {}, [second]: {} })

        expect(items[first].error.code).toBe('AMBIGUOUS_ADDRESS')
        expect(items[second].error.code).toBe('AMBIGUOUS_ADDRESS')
        expect(store.persist).not.toHaveBeenCalled()
    })

    test.each([
        ['кв.53/1', 'кв.53', '53/1'],
        ['кв.5,31,32', 'кв.5', '5, 31, 32'],
        ['нп.8', 'пом.8 нежилое', '8'],
        ['комн.23', 'кв.23, комн.23', '23'],
        ['кв.001', 'кв.1', '001'],
        ['м/м ММ3', 'м/м 3', 'ММ3'],
    ])('preserves the source unit description %s when Pullenti returns %s', async (source, normalized, unitName) => {
        pullenti.processAddressJson.mockResolvedValue(makePullentiAddress(normalized))
        const input = `${HOUSE}, ${source}`

        const { items } = await normalize({ [input]: {} })

        expect(items[input].result.unitName).toBe(unitName)
    })

    test('keeps a storage unit with a parenthesized apartment reference', async () => {
        pullenti.processAddressJson.mockResolvedValue(makePullentiAddress('кв.25, помещ.1'))
        const input = `${HOUSE}, кл.1 (кв.25)`

        const { items } = await normalize({ [input]: {} })

        expect(items[input].result).toMatchObject({ unitName: '1 (кв.25)', unitType: 'warehouse' })
    })

    test('stores the house alias with organization helpers when text alone resolved it', async () => {
        const input = 'ул Ленина, д 12, к 2, кв 001'
        const helpers = { tin: '7707083893' }

        const { items } = await normalize({ [input]: {} }, helpers)

        expect(items[input].result.globalId).toBe(HOUSE_GUID)
        expect(store.persist).toHaveBeenCalledWith(expect.objectContaining({
            sources: expect.arrayContaining([getSourceKey('ул Ленина, д 12, к 2', helpers)]),
        }))
    })

    test('allows safe property names in a per-item response', async () => {
        const body = JSON.parse('{"items":{"__proto__":42,"constructor":false}}')
        const request = readBulkNormalizeRequest(body, 100)
        expect(request.items.map(([key]) => key)).toEqual(['__proto__', 'constructor'])
        const { items } = await normalize(body.items)
        expect(Object.getPrototypeOf(items)).toBe(Object.prototype)
        expect(items.__proto__.error.code).toBe('INVALID_INPUT')
        expect(items.constructor.error.code).toBe('INVALID_INPUT')
    })
})
