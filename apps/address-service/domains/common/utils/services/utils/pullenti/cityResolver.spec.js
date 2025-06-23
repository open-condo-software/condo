const { resolveCity } = require('./cityResolver')

describe('cityResolver', () => {
    describe('resolveCity', () => {
        it('should return all null fields for null or undefined input', () => {
            expect(resolveCity(null)).toEqual({
                city: null,
                city_type: null,
                city_type_full: null,
                city_with_type: null,
                city_fias_id: null,
                city_kladr_id: null,
            })
            expect(resolveCity(undefined)).toEqual({
                city: null,
                city_type: null,
                city_type_full: null,
                city_with_type: null,
                city_fias_id: null,
                city_kladr_id: null,
            })
        })

        it('should resolve all fields when area.name and recognized type are present', () => {
            const gar = {
                guid: 'test-guid',
                area: {
                    type: 'город',
                    name: 'Москва',
                },
                param: [
                    { '@_name': 'kladrcode', '#text': '7700000000000' },
                ],
            }
            expect(resolveCity(gar)).toEqual({
                city: 'Москва',
                city_type: 'г',
                city_type_full: 'город',
                city_with_type: 'г Москва',
                city_fias_id: 'test-guid',
                city_kladr_id: '7700000000000',
            })
        })

        it('should return all null fields if area is missing', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveCity(gar)).toEqual({
                city: null,
                city_type: null,
                city_type_full: null,
                city_with_type: null,
                city_fias_id: null,
                city_kladr_id: null,
            })
        })

        it('should return all null fields if area.name is missing', () => {
            const gar = {
                area: {
                    type: 'город',
                },
            }
            expect(resolveCity(gar)).toEqual({
                city: null,
                city_type: null,
                city_type_full: null,
                city_with_type: null,
                city_fias_id: null,
                city_kladr_id: null,
            })
        })

        it('should return all null fields if area.type is not recognized', () => {
            const gar = {
                area: {
                    type: 'unknown-type',
                    name: 'Test',
                },
            }
            expect(resolveCity(gar)).toEqual({
                city: null,
                city_type: null,
                city_type_full: null,
                city_with_type: null,
                city_fias_id: null,
                city_kladr_id: null,
            })
        })

        it('should return all null fields if area.name is null', () => {
            const gar = {
                area: {
                    type: 'город',
                    name: null,
                },
            }
            expect(resolveCity(gar)).toEqual({
                city: null,
                city_type: null,
                city_type_full: null,
                city_with_type: null,
                city_fias_id: null,
                city_kladr_id: null,
            })
        })
    })
})
