const { resolveFlat } = require('./flatResolver')

describe('flatResolver', () => {
    describe('resolveFlat', () => {
        it('should return all null fields for null or undefined input', () => {
            expect(resolveFlat(null)).toEqual({
                flat: null,
                flat_type: null,
                flat_type_full: null,
                flat_fias_id: null,
                flat_cadnum: null,
            })
            expect(resolveFlat(undefined)).toEqual({
                flat: null,
                flat_type: null,
                flat_type_full: null,
                flat_fias_id: null,
                flat_cadnum: null,
            })
        })

        it('should resolve all fields when room.num and recognized type are present', () => {
            const gar = {
                guid: 'test-guid',
                room: {
                    num: '42',
                    type: 'квартира',
                },
                param: [
                    { '@_name': 'kadasternumber', '#text': 'kad-123' },
                ],
            }
            expect(resolveFlat(gar)).toEqual({
                flat: '42',
                flat_type: 'кв',
                flat_type_full: 'квартира',
                flat_fias_id: 'test-guid',
                flat_cadnum: 'kad-123',
            })
        })

        it('should return all null fields if room is missing', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveFlat(gar)).toEqual({
                flat: null,
                flat_type: null,
                flat_type_full: null,
                flat_fias_id: null,
                flat_cadnum: null,
            })
        })

        it('should return all null fields if room.num is missing', () => {
            const gar = {
                room: {
                    type: 'квартира',
                },
            }
            expect(resolveFlat(gar)).toEqual({
                flat: null,
                flat_type: null,
                flat_type_full: null,
                flat_fias_id: null,
                flat_cadnum: null,
            })
        })

        it('should return all null fields if room.type is not recognized', () => {
            const gar = {
                room: {
                    num: '42',
                    type: 'unknown-type',
                },
            }
            expect(resolveFlat(gar)).toEqual({
                flat: null,
                flat_type: null,
                flat_type_full: null,
                flat_fias_id: null,
                flat_cadnum: null,
            })
        })

        it('should return all null fields if room.num is null', () => {
            const gar = {
                room: {
                    num: null,
                    type: 'квартира',
                },
            }
            expect(resolveFlat(gar)).toEqual({
                flat: null,
                flat_type: null,
                flat_type_full: null,
                flat_fias_id: null,
                flat_cadnum: null,
            })
        })
    })
})
