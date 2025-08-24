const { resolveStreet } = require('./streetResolver')

describe('streetResolver', () => {
    describe('resolveStreet', () => {
        it('should return all null fields for null or undefined input', () => {
            expect(resolveStreet(null)).toEqual({
                street: null,
                street_type: null,
                street_type_full: null,
                street_with_type: null,
                street_fias_id: null,
                street_kladr_id: null,
            })
            expect(resolveStreet(undefined)).toEqual({
                street: null,
                street_type: null,
                street_type_full: null,
                street_with_type: null,
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should resolve улица type', () => {
            const gar = {
                area: { type: 'улица', name: 'Ленина' },
                guid: 'test-guid',
                param: [
                    { '@_name': 'kladrcode', '#text': '1234567890' },
                ],
            }
            expect(resolveStreet(gar)).toEqual({
                street: 'Ленина',
                street_type: 'ул',
                street_type_full: 'улица',
                street_with_type: 'ул Ленина',
                street_fias_id: 'test-guid',
                street_kladr_id: '1234567890',
            })
        })

        it('should resolve проспект type', () => {
            const gar = {
                area: { type: 'проспект', name: 'Невский' },
            }
            expect(resolveStreet(gar)).toEqual({
                street: 'Невский',
                street_type: 'пр-кт',
                street_type_full: 'проспект',
                street_with_type: 'пр-кт Невский',
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should resolve просп type', () => {
            const gar = {
                area: { type: 'просп', name: 'Ленинский' },
            }
            expect(resolveStreet(gar)).toEqual({
                street: 'Ленинский',
                street_type: 'пр-кт',
                street_type_full: 'проспект',
                street_with_type: 'пр-кт Ленинский',
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should handle missing area field', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveStreet(gar)).toEqual({
                street: null,
                street_type: null,
                street_type_full: null,
                street_with_type: null,
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should handle null area name', () => {
            const gar = {
                area: { type: 'улица', name: null },
            }
            expect(resolveStreet(gar)).toEqual({
                street: null,
                street_type: null,
                street_type_full: null,
                street_with_type: null,
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should handle area.name as array', () => {
            const gar = {
                area: { type: 'улица', name: ['Первая', 'Вторая'] },
            }
            expect(resolveStreet(gar)).toEqual({
                street: 'Первая',
                street_type: 'ул',
                street_type_full: 'улица',
                street_with_type: 'ул Первая',
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should resolve street with numeric kladr code', () => {
            const gar = {
                area: { type: 'улица', name: 'Тестовая' },
                param: [
                    { '@_name': 'kladrcode', '#text': 123456 },
                ],
                guid: 'guid-123',
            }
            expect(resolveStreet(gar)).toEqual({
                street: 'Тестовая',
                street_type: 'ул',
                street_type_full: 'улица',
                street_with_type: 'ул Тестовая',
                street_fias_id: 'guid-123',
                street_kladr_id: '123456',
            })
        })
    })
})
