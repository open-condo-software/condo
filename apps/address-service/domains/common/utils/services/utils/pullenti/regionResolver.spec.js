const { resolveRegion } = require('./regionResolver')

describe('regionResolver', () => {
    describe('resolveRegion', () => {
        it('should return all null fields for null or undefined input', () => {
            expect(resolveRegion(null)).toEqual({
                region: null,
                region_type: null,
                region_type_full: null,
                region_with_type: null,
                region_fias_id: null,
                region_kladr_id: null,
            })
            expect(resolveRegion(undefined)).toEqual({
                region: null,
                region_type: null,
                region_type_full: null,
                region_with_type: null,
                region_fias_id: null,
                region_kladr_id: null,
            })
        })

        it('should resolve область type', () => {
            const gar = {
                area: { type: 'область', name: 'Московская' },
                guid: 'test-guid',
                param: [
                    { '@_name': 'kladrcode', '#text': '5000000000000' },
                ],
            }
            expect(resolveRegion(gar)).toEqual({
                region: 'Московская',
                region_type: 'обл',
                region_type_full: 'область',
                region_with_type: 'Московская обл',
                region_fias_id: 'test-guid',
                region_kladr_id: '5000000000000',
            })
        })

        it('should resolve край type', () => {
            const gar = {
                area: { type: 'край', name: 'Краснодарский' },
            }
            expect(resolveRegion(gar)).toEqual({
                region: 'Краснодарский',
                region_type: 'кр',
                region_type_full: 'край',
                region_with_type: 'Краснодарский кр',
                region_fias_id: null,
                region_kladr_id: null,
            })
        })

        it('should handle missing area field', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveRegion(gar)).toEqual({
                region: null,
                region_type: null,
                region_type_full: null,
                region_with_type: null,
                region_fias_id: null,
                region_kladr_id: null,
            })
        })

        it('should handle null area name', () => {
            const gar = {
                area: { type: 'область', name: null },
            }
            expect(resolveRegion(gar)).toEqual({
                region: null,
                region_type: null,
                region_type_full: null,
                region_with_type: null,
                region_fias_id: null,
                region_kladr_id: null,
            })
        })

        it('should resolve region with numeric kladr code', () => {
            const gar = {
                area: { type: 'область', name: 'Тестовая' },
                param: [
                    { '@_name': 'kladrcode', '#text': 123456 },
                ],
            }
            expect(resolveRegion(gar)).toEqual({
                region: 'Тестовая',
                region_type: 'обл',
                region_type_full: 'область',
                region_with_type: 'Тестовая обл',
                region_fias_id: null,
                region_kladr_id: '123456',
            })
        })
    })
})
