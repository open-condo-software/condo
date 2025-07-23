const { resolveStead } = require('./steadResolver')

describe('steadResolver', () => {
    describe('resolveStead', () => {
        it('should return all null fields for null or undefined input', () => {
            expect(resolveStead(null)).toEqual({
                stead: null,
                stead_type: null,
                stead_type_full: null,
                stead_fias_id: null,
                stead_cadnum: null,
            })
            expect(resolveStead(undefined)).toEqual({
                stead: null,
                stead_type: null,
                stead_type_full: null,
                stead_fias_id: null,
                stead_cadnum: null,
            })
        })

        it('should resolve stead with all fields', () => {
            const gar = {
                house: { pnum: '123' },
                guid: 'test-guid',
                param: [
                    { '@_name': 'kadasternumber', '#text': 'kad-123' },
                ],
            }
            expect(resolveStead(gar)).toEqual({
                stead: '123',
                stead_type: 'уч',
                stead_type_full: 'участок',
                stead_fias_id: 'test-guid',
                stead_cadnum: 'kad-123',
            })
        })

        it('should handle missing params', () => {
            const gar = {
                house: { pnum: '123' },
            }
            expect(resolveStead(gar)).toEqual({
                stead: '123',
                stead_type: 'уч',
                stead_type_full: 'участок',
                stead_fias_id: null,
                stead_cadnum: null,
            })
        })

        it('should handle missing stead field', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveStead(gar)).toEqual({
                stead: null,
                stead_type: null,
                stead_type_full: null,
                stead_fias_id: null,
                stead_cadnum: null,
            })
        })

        it('should handle null stead pnum', () => {
            const gar = {
                house: { pnum: null },
            }
            expect(resolveStead(gar)).toEqual({
                stead: null,
                stead_type: null,
                stead_type_full: null,
                stead_fias_id: null,
                stead_cadnum: null,
            })
        })

        it('should resolve stead with numeric pnum', () => {
            const gar = {
                house: { pnum: 456 },
                guid: 'guid-456',
                param: [
                    { '@_name': 'kadasternumber', '#text': 789 },
                ],
            }
            expect(resolveStead(gar)).toEqual({
                stead: '456',
                stead_type: 'уч',
                stead_type_full: 'участок',
                stead_fias_id: 'guid-456',
                stead_cadnum: '789',
            })
        })
    })
})
