const { resolveFlat } = require('./flatResolver')

describe('flatResolver', () => {
    describe('resolveFlat', () => {
        it('should return empty object for null input', () => {
            expect(resolveFlat(null)).toEqual({})
            expect(resolveFlat(undefined)).toEqual({})
        })

        it('should resolve квартира type', () => {
            const apartmentLevel = {
                gar: [{
                    level: 'apartment',
                    guid: 'test-guid',
                    room: {
                        num: '42',
                    },
                    param: [
                        { '@_name': 'kadasternumber', '#text': 'kad-123' },
                    ],
                }],
            }

            expect(resolveFlat(apartmentLevel)).toEqual({
                flat: '42',
                flat_type: 'кв',
                flat_type_full: 'квартира',
                flat_fias_id: 'test-guid',
                flat_cadnum: 'kad-123',
            })
        })

        it('should resolve апартаменты type', () => {
            const apartmentLevel = {
                gar: [{
                    level: 'apartment',
                    room: {
                        num: '42',
                        type: 'apartment',
                    },
                }],
            }

            expect(resolveFlat(apartmentLevel)).toEqual({
                flat: '42',
                flat_type: 'апарт',
                flat_type_full: 'апартаменты',
                flat_fias_id: null,
                flat_cadnum: null,
            })
        })
    })
})
