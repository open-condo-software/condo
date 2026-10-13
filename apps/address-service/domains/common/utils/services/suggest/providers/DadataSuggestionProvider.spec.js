const { BUILDING_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')

const { DadataSuggestionProvider } = require('./DadataSuggestionProvider')

describe('DadataSuggestionProvider', () => {
    describe('normalize address type', () => {
        process.env.DADATA_SUGGESTIONS = '{"url":"where is dadata?", "token":"tooooken"}'
        const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
        const cases = [
            ['stead exposed as building', { stead_fias_id: 'stead-id', stead: '10', stead_type_full: 'участок', geo_lat: '55.75', geo_lon: '37.61', qc_geo: '0' }, BUILDING_ADDRESS_TYPE],
            ['stead with a house type exposed as building', { stead_fias_id: 'stead-id', house_type_full: 'дом' }, BUILDING_ADDRESS_TYPE],
            ['regular building', { house_type_full: 'дом' }, BUILDING_ADDRESS_TYPE],
            ['street', { street_type_full: 'улица' }, null],
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
