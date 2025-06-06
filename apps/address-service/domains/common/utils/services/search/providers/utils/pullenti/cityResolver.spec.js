const { resolveCity } = require('./cityResolver')

describe('cityResolver', () => {
    describe('resolveCity', () => {
        it('should return empty object for null input', () => {
            expect(resolveCity(null)).toEqual({})
            expect(resolveCity(undefined)).toEqual({})
        })

        it('should resolve city with all fields', () => {
            const cityLevel = {
                gar: [{
                    guid: 'test-guid',
                    area: {
                        type: 'город',
                        name: 'Москва',
                    },
                    param: [
                        { '@_name': 'kladrcode', '#text': '7700000000000' },
                    ],
                }],
            }

            expect(resolveCity(cityLevel)).toEqual({
                city: 'Москва',
                city_type: 'г',
                city_type_full: 'город',
                city_with_type: 'г Москва',
                city_fias_id: 'test-guid',
                city_kladr_id: '7700000000000',
            })
        })

        it('should handle missing GAR parameters', () => {
            const cityLevel = {
                gar: [{
                    area: {
                        type: 'город',
                        name: 'Казань',
                    },
                }],
            }

            expect(resolveCity(cityLevel)).toEqual({
                city: 'Казань',
                city_type: 'г',
                city_type_full: 'город',
                city_with_type: 'г Казань',
                city_fias_id: null,
                city_kladr_id: null,
            })
        })

        it('should handle missing area field', () => {
            const cityLevel = {
                gar: [{
                    guid: 'test-guid',
                }],
            }

            expect(resolveCity(cityLevel)).toEqual({
                city: null,
                city_type: 'г',
                city_type_full: 'город',
                city_with_type: '',
                city_fias_id: 'test-guid',
                city_kladr_id: null,
            })
        })

        it('should handle null area name', () => {
            const cityLevel = {
                gar: [{
                    guid: 'test-guid',
                    area: {
                        type: 'город',
                        name: null,
                    },
                }],
            }

            expect(resolveCity(cityLevel)).toEqual({
                city: null,
                city_type: 'г',
                city_type_full: 'город',
                city_with_type: '',
                city_fias_id: 'test-guid',
                city_kladr_id: null,
            })
        })

        it('should handle empty gar array', () => {
            const cityLevel = {
                gar: [],
            }

            expect(resolveCity(cityLevel)).toEqual({
                city: null,
                city_type: 'г',
                city_type_full: 'город',
                city_with_type: '',
                city_fias_id: null,
                city_kladr_id: null,
            })
        })
    })
})
