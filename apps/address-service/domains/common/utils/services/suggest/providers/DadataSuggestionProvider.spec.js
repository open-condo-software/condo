const { BUILDING_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')
const { DadataSearchProvider } = require('@address-service/domains/common/utils/services/search/providers/DadataSearchProvider')

const { DadataSuggestionProvider } = require('./DadataSuggestionProvider')

describe('DadataSuggestionProvider', () => {
    describe('normalize address type', () => {
        process.env.DADATA_SUGGESTIONS = '{"url":"where is dadata?", "token":"tooooken"}'
        const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
        const cases = [
            ['stead exposed as building', { stead_fias_id: 'stead-id', stead: '10', stead_type_full: 'участок', geo_lat: '55.75', geo_lon: '37.61', qc_geo: '0' }, BUILDING_ADDRESS_TYPE],
            ['stead without a FIAS ID is not exposed as building', { stead: '42', stead_type: 'уч', stead_type_full: 'участок' }, null],
            ['regular building', { house_type_full: 'дом' }, BUILDING_ADDRESS_TYPE],
            ['street', { street_type_full: 'улица' }, null],
            ['no house or stead fields', { city: 'Moscow' }, null],
            ['missing stead id', { stead_fias_id: undefined, house_type_full: 'дом' }, BUILDING_ADDRESS_TYPE],
            ['null stead id', { stead_fias_id: null, house_type_full: 'дом' }, BUILDING_ADDRESS_TYPE],
            ['empty stead id', { stead_fias_id: '', house_type_full: 'дом' }, BUILDING_ADDRESS_TYPE],
        ]

        test.each(cases)('%s', (name, data, expectedType) => {
            const [normalized] = provider.normalize([{ value: 'address', unrestricted_value: 'full address', data }])

            expect(normalized.type).toBe(expectedType)
            expect(normalized.rawValue).toBe('address')
            expect(normalized.provider.rawData.data).toBe(data)
            expect(normalized.data.stead_fias_id).toBe(data.stead_fias_id)
            expect(normalized.data.stead).toBe(data.stead)
            expect(normalized.data.stead_type_full).toBe(data.stead_type_full)
            expect(normalized.data.geo_lat).toBe(data.geo_lat)
            expect(normalized.data.geo_lon).toBe(data.geo_lon)
            expect(normalized.data.qc_geo).toBe(data.qc_geo)
        })
    })

    describe('stead house compatibility', () => {
        test.each([undefined, null, ''])('exposes all stead fields when house fields are %s', (emptyHouseField) => {
            process.env.DADATA_SUGGESTIONS = '{"url":"https://example.com", "token":"test-token"}'
            const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
            const searchProvider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
            const data = Object.freeze({
                stead: '42',
                stead_type: 'уч',
                stead_type_full: 'участок',
                stead_fias_id: 'stead-id',
                stead_cadnum: 'stead-cadnum',
                house: emptyHouseField,
                house_type: emptyHouseField,
                house_type_full: emptyHouseField,
                house_fias_id: emptyHouseField,
                house_kladr_id: emptyHouseField,
                house_cadnum: emptyHouseField,
                city: 'Moscow',
                geo_lat: '55.75',
                geo_lon: '37.61',
                qc_geo: '0',
            })
            const suggestion = { value: 'Moscow, участок 42', unrestricted_value: 'Moscow, участок 42', data }
            const [normalized] = provider.normalize([suggestion])

            expect(normalized.type).toBe(BUILDING_ADDRESS_TYPE)
            expect(normalized.data).toEqual({
                ...data,
                house: '42', house_type: 'уч', house_type_full: 'участок',
                house_fias_id: 'stead-id', house_cadnum: 'stead-cadnum', house_kladr_id: null,
            })
            expect(normalized.provider.rawData).toBe(suggestion)
            expect(normalized.value).toBe(suggestion.value)
            expect(searchProvider.normalize([suggestion])).toEqual([normalized])
            expect(searchProvider.generateAddressKey(normalized)).toBe(searchProvider.generateAddressKey({ data }))
            expect(provider.generateAddressKey(normalized)).toBe('fias_id:stead-id')
            expect(searchProvider.extractHeuristics(normalized)).toEqual(searchProvider.extractHeuristics({ data }))
        })

        test('preserves real house fields', () => {
            process.env.DADATA_SUGGESTIONS = '{"url":"https://example.com", "token":"test-token"}'
            const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
            const data = {
                house: '10', house_type: 'д', house_type_full: 'дом', house_fias_id: 'house-id', house_cadnum: 'house-cadnum', house_kladr_id: 'house-kladr',
            }
            const [normalized] = provider.normalize([{ value: 'house address', data }])

            expect(normalized.data).toMatchObject(data)
            expect(normalized.type).toBe(BUILDING_ADDRESS_TYPE)
        })

        test('preserves missing type labels for a stead', () => {
            process.env.DADATA_SUGGESTIONS = '{"url":"https://example.com", "token":"test-token"}'
            const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
            const [normalized] = provider.normalize([{ data: { stead: '42', stead_fias_id: 'stead-id' } }])

            expect(normalized.data.house).toBe('42')
            expect(normalized.data.house_type).toBeUndefined()
            expect(normalized.data.house_type_full).toBeUndefined()
        })

        test.each(['10', undefined])('preserves a real house FIAS identity when its number is %s', (house) => {
            process.env.DADATA_SUGGESTIONS = '{"url":"https://example.com", "token":"test-token"}'
            const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
            const searchProvider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
            const data = {
                house, house_type: 'д', house_type_full: 'дом', house_fias_id: 'house-id',
            }
            const [normalized] = provider.normalize([{ data }])

            expect(normalized.data).toMatchObject(data)
            expect(provider.generateAddressKey(normalized)).toBe('fias_id:house-id')
            expect(searchProvider.generateAddressKey(normalized)).toBe('fias_id:house-id')
        })

        test.each([
            ['house', { house: '13', house_type: 'д', house_type_full: 'дом' }, '13', 'д'],
            ['stead', { stead: '42', stead_type: 'уч', stead_type_full: 'участок' }, undefined, undefined],
        ])('preserves original house fields for a %s without a FIAS ID', (name, data, expectedHouse, expectedType) => {
            process.env.DADATA_SUGGESTIONS = '{"url":"https://example.com", "token":"test-token"}'
            const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
            const [normalized] = provider.normalize([{ data }])

            expect(normalized.data.house).toBe(expectedHouse)
            expect(normalized.data.house_type).toBe(expectedType)
            expect(normalized.data.house_fias_id).toBeUndefined()
        })

        test.each([undefined, null, ''])('does not copy stead fields without a stead FIAS ID: %s', (steadFiasId) => {
            process.env.DADATA_SUGGESTIONS = '{"url":"https://example.com", "token":"test-token"}'
            const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
            const data = { stead: '42', stead_type: 'уч', stead_type_full: 'участок', stead_cadnum: 'stead-cadnum', stead_fias_id: steadFiasId }
            const [normalized] = provider.normalize([{ data }])

            expect(normalized.type).toBeNull()
            expect(normalized.data).toMatchObject(data)
            for (const field of ['house', 'house_type', 'house_type_full', 'house_fias_id', 'house_cadnum', 'house_kladr_id']) {
                expect(normalized.data[field]).toBeUndefined()
            }
        })
    })

    describe('Trailing space added correctly', () => {
        const cases = [
            ['дом 345', 'дом 345 '],
            ['дом 23 ', 'дом 23 '],
            ['дом 32В', 'дом 32В '],
            ['дом 2ж ', 'дом 2ж '],
            ['дом 4 А', 'дом 4 А '],
            ['дом 4 ф ', 'дом 4 ф '],
            ['дом 4  д ', 'дом 4  д'],
            ['улица', 'улица'],
            ['адрес ', 'адрес'],
        ]

        test.each(cases)('%p', (address, expected) => {
            expect(DadataSuggestionProvider.prepareQuery(address)).toEqual(expected)
        })
    })
})
