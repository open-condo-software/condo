const { resolveStead } = require('./steadResolver')

describe('steadResolver', () => {
    describe('resolveStead', () => {
        it('should return empty object for null input', () => {
            expect(resolveStead(null)).toEqual({})
            expect(resolveStead(undefined)).toEqual({})
        })

        it('should resolve stead with all fields', () => {
            const plotLevel = {
                gar: [{
                    guid: 'test-guid',
                    stead: {
                        pnum: '123',
                    },
                    param: [
                        { '@_name': 'kadasternumber', '#text': 'kad-123' },
                    ],
                }],
            }

            expect(resolveStead(plotLevel)).toEqual({
                stead: '123',
                stead_type: 'уч',
                stead_type_full: 'участок',
                stead_fias_id: 'test-guid',
                stead_cadnum: 'kad-123',
            })
        })

        it('should handle missing params', () => {
            const plotLevel = {
                gar: [{
                    stead: {
                        pnum: '123',
                    },
                }],
            }

            expect(resolveStead(plotLevel)).toEqual({
                stead: '123',
                stead_type: 'уч',
                stead_type_full: 'участок',
                stead_fias_id: null,
                stead_cadnum: null,
            })
        })
    })
})
