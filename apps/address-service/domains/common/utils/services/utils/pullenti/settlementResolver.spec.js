const { resolveSettlement } = require('./settlementResolver')

describe('settlementResolver', () => {
    describe('resolveSettlement', () => {
        it('should return all null fields for null or undefined input', () => {
            expect(resolveSettlement(null)).toEqual({
                settlement: null,
                settlement_type: null,
                settlement_type_full: null,
                settlement_with_type: null,
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
            expect(resolveSettlement(undefined)).toEqual({
                settlement: null,
                settlement_type: null,
                settlement_type_full: null,
                settlement_with_type: null,
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should resolve село type', () => {
            const gar = {
                area: { type: 'село', name: 'Иваново' },
                guid: 'test-guid',
                param: [
                    { '@_name': 'kladrcode', '#text': '1234567890' },
                ],
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: 'Иваново',
                settlement_type: 'с',
                settlement_type_full: 'село',
                settlement_with_type: 'село Иваново',
                settlement_fias_id: 'test-guid',
                settlement_kladr_id: '1234567890',
            })
        })

        it('should resolve поселок type', () => {
            const gar = {
                area: { type: 'поселок', name: 'Лесной' },
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: 'Лесной',
                settlement_type: 'пос',
                settlement_type_full: 'поселок',
                settlement_with_type: 'поселок Лесной',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle missing area field', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: null,
                settlement_type: null,
                settlement_type_full: null,
                settlement_with_type: null,
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle null area name', () => {
            const gar = {
                area: { type: 'село', name: null },
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: null,
                settlement_type: null,
                settlement_type_full: null,
                settlement_with_type: null,
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle деревня type explicitly', () => {
            const gar = {
                area: { type: 'деревня', name: 'Петрово' },
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: 'Петрово',
                settlement_type: 'д',
                settlement_type_full: 'деревня',
                settlement_with_type: 'деревня Петрово',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should resolve поселение type', () => {
            const gar = {
                area: { type: 'поселение', name: 'Новое' },
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: 'Новое',
                settlement_type: 'п',
                settlement_type_full: 'поселение',
                settlement_with_type: 'поселение Новое',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle area.name as array', () => {
            const gar = {
                area: { type: 'село', name: ['Первое', 'Второе'] },
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: 'Первое',
                settlement_type: 'с',
                settlement_type_full: 'село',
                settlement_with_type: 'село Первое',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should resolve settlement with numeric kladr code', () => {
            const gar = {
                area: { type: 'село', name: 'Тестовое' },
                param: [
                    { '@_name': 'kladrcode', '#text': 123456 },
                ],
                guid: 'guid-123',
            }
            expect(resolveSettlement(gar)).toEqual({
                settlement: 'Тестовое',
                settlement_type: 'с',
                settlement_type_full: 'село',
                settlement_with_type: 'село Тестовое',
                settlement_fias_id: 'guid-123',
                settlement_kladr_id: '123456',
            })
        })
    })
})
