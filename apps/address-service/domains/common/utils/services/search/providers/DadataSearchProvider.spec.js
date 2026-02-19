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
