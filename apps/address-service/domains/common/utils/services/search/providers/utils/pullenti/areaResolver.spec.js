const { resolveArea } = require('./areaResolver')

describe('areaResolver', () => {
    describe('resolveArea', () => {
        it('should return empty object for null input', () => {
            expect(resolveArea(null)).toEqual({})
            expect(resolveArea(undefined)).toEqual({})
        })

        it('should resolve район type', () => {
            const districtLevel = {
                gar: [{
                    level: 'adminarea',
                    guid: 'test-guid',
                    area: {
                        type: 'район',
                        name: 'Ленинский',
                    },
                    param: [
                        { '@_name': 'kladrcode', '#text': '1234567890' },
                    ],
                }],
            }

            expect(resolveArea(districtLevel)).toEqual({
                area: 'Ленинский',
                area_type: 'р-н',
                area_type_full: 'район',
                area_with_type: 'район Ленинский',
                area_fias_id: 'test-guid',
                area_kladr_id: '1234567890',
            })
        })

        it('should resolve муниципальный округ type', () => {
            const districtLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'муниципальный округ',
                        name: 'Южный',
                    },
                }],
            }

            expect(resolveArea(districtLevel)).toEqual({
                area: 'Южный',
                area_type: 'муницип окр',
                area_type_full: 'муниципальный округ',
                area_with_type: 'муниципальный округ Южный',
                area_fias_id: null,
                area_kladr_id: null,
            })
        })
    })
})
