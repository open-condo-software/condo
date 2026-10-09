const { BUILDING_ADDRESS_TYPE, STEAD_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')

const { DadataSuggestionProvider } = require('./DadataSuggestionProvider')

describe('DadataSuggestionProvider', () => {
    describe('normalize address type', () => {
        process.env.DADATA_SUGGESTIONS = '{"url":"where is dadata?", "token":"tooooken"}'
        const provider = new DadataSuggestionProvider({ req: { id: 'test-request-id' } })
        const cases = [
            ['stead only', { stead_fias_id: 'stead-id' }, STEAD_ADDRESS_TYPE],
            ['stead takes precedence over a house type', { stead_fias_id: 'stead-id', house_type_full: 'дом' }, STEAD_ADDRESS_TYPE],
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
