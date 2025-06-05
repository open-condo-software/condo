const { resolveRegion } = require('./regionResolver')

describe('regionResolver', () => {
    describe('resolveRegion', () => {
        it('should return empty object for null input', () => {
            expect(resolveRegion(null)).toEqual({})
            expect(resolveRegion(undefined)).toEqual({})
        })

        it('should resolve область type', () => {
            const regionLevel = {
                gar: [{
                    level: 'adminarea',
                    guid: 'test-guid',
                    area: {
                        type: 'область',
                        name: 'Московская',
                    },
                    param: [
                        { '@_name': 'kladrcode', '#text': '5000000000000' },
                    ],
                }],
            }

            expect(resolveRegion(regionLevel)).toEqual({
                region: 'Московская',
                region_type: 'обл',
                region_type_full: 'область',
                region_with_type: 'Московская обл',
                region_fias_id: 'test-guid',
                region_kladr_id: '5000000000000',
            })
        })

        it('should resolve край type', () => {
            const regionLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'край',
                        name: 'Краснодарский',
                    },
                }],
            }

            expect(resolveRegion(regionLevel)).toEqual({
                region: 'Краснодарский',
                region_type: 'кр',
                region_type_full: 'край',
                region_with_type: 'Краснодарский кр',
                region_fias_id: null,
                region_kladr_id: null,
            })
        })
    })
})
