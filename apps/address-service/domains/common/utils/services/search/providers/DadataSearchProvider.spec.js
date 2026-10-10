jest.mock('@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider', () => ({
    DadataSuggestionProvider: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        normalize: jest.fn(),
        getAddressByFiasId: jest.fn(),
    })),
}))

const {
    HEURISTIC_TYPE_FIAS_ID,
    HEURISTIC_TYPE_COORDINATES,
    HEURISTIC_TYPE_FALLBACK,
} = require('@address-service/domains/common/constants/heuristicTypes')

const { DadataSearchProvider } = require('./DadataSearchProvider')

describe('DadataSearchProvider.extractHeuristics', () => {
    test('creates coordinate heuristic only for qc_geo=0', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })

        const heuristics = provider.extractHeuristics({
            data: {
                house_fias_id: 'test-house-fias-id',
                geo_lat: '55.751244',
                geo_lon: '37.618423',
                qc_geo: '0',
            },
        })

        expect(heuristics).toContainEqual({
            type: HEURISTIC_TYPE_FIAS_ID,
            value: 'test-house-fias-id',
            reliability: 95,
            meta: null,
        })
        expect(heuristics).toContainEqual({
            type: HEURISTIC_TYPE_COORDINATES,
            value: '55.751244,37.618423',
            reliability: 90,
            meta: { qc_geo: '0' },
        })
    })

    test('does not create coordinate heuristic for non-exact qc_geo', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })

        const heuristics = provider.extractHeuristics({
            data: {
                house_fias_id: 'test-house-fias-id',
                geo_lat: '55.751244',
                geo_lon: '37.618423',
                qc_geo: '2',
            },
        })

        expect(heuristics).toEqual([
            {
                type: HEURISTIC_TYPE_FIAS_ID,
                value: 'test-house-fias-id',
                reliability: 95,
                meta: null,
            },
        ])
    })

    test('keeps fallback heuristic even when coordinate heuristic is skipped', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })

        const heuristics = provider.extractHeuristics({
            data: {
                country: 'Russia',
                city: 'Moscow',
                street_type_full: 'street',
                street: 'Lenina',
                house: '10',
                geo_lat: '55.751244',
                geo_lon: '37.618423',
                qc_geo: '3',
            },
        })

        expect(heuristics).toHaveLength(1)
        expect(heuristics[0].type).toBe(HEURISTIC_TYPE_FALLBACK)
        expect(heuristics[0].reliability).toBe(10)
    })
})

describe('DadataSearchProvider stead identity', () => {
    test('uses stead FIAS ID as the key and emits shared fallback heuristic', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
        const plotOne = { data: { stead_fias_id: 'plot-1', city: 'Moscow', house: '10' } }
        const plotTwo = { data: { stead_fias_id: 'plot-2', city: 'Moscow', house: '10' } }

        expect(provider.extractHeuristics(plotOne)).toEqual([
            { type: HEURISTIC_TYPE_FIAS_ID, value: 'plot-1', reliability: 95, meta: null },
            { type: HEURISTIC_TYPE_FALLBACK, value: 'moscow~10', reliability: 10, meta: null },
        ])
        expect(provider.generateAddressKey(plotOne)).toBe(`${HEURISTIC_TYPE_FIAS_ID}:plot-1`)
        expect(provider.generateAddressKey(plotTwo)).toBe(`${HEURISTIC_TYPE_FIAS_ID}:plot-2`)
    })

    test('does not use exact coordinates to match a stead', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
        const normalized = {
            data: {
                stead_fias_id: 'stead-1',
                geo_lat: '55.751244',
                geo_lon: '37.618423',
                qc_geo: '0',
            },
        }

        expect(provider.extractHeuristics(normalized)).toEqual([{
            type: HEURISTIC_TYPE_FIAS_ID,
            value: 'stead-1',
            reliability: 95,
            meta: null,
        }])
    })

    test('emits fallback heuristic when a house FIAS ID exists', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
        const normalized = {
            data: {
                house_fias_id: 'house-1',
                city: 'Moscow',
                house: '10',
            },
        }

        expect(provider.extractHeuristics(normalized)).toEqual([
            { type: HEURISTIC_TYPE_FIAS_ID, value: 'house-1', reliability: 95, meta: null },
            { type: HEURISTIC_TYPE_FALLBACK, value: 'moscow~10', reliability: 10, meta: null },
        ])
    })

    test.each([undefined, null, ''])('keeps fallback behavior for empty stead ID %s', (steadFiasId) => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
        const normalized = { data: { stead_fias_id: steadFiasId, city: 'Moscow', house: '10' } }

        expect(provider.extractHeuristics(normalized)).toEqual([{
            type: HEURISTIC_TYPE_FALLBACK,
            value: provider.generateFallbackKey(normalized),
            reliability: 10,
            meta: null,
        }])
    })

    test('uses stead as the fallback address part when house is absent', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
        const normalized = { data: { city: 'Moscow', stead: 'plot 10' } }

        expect(provider.generateFallbackKey(normalized)).toContain('plot_10')
    })
})

describe('DadataSearchProvider.normalize', () => {
    test('delegates suggestion normalization and returns its result', () => {
        const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
        const suggestions = [{ value: 'plot address', data: { stead_fias_id: 'stead-id' } }]
        const normalized = [{ type: 'stead', rawValue: 'plot address' }]
        provider.suggestionProvider.normalize.mockReturnValue(normalized)

        expect(provider.normalize(suggestions)).toBe(normalized)
        expect(provider.suggestionProvider.normalize).toHaveBeenCalledWith(suggestions)
    })
})
