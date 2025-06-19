const { resolveSettlement } = require('./settlementResolver')

describe('settlementResolver', () => {
    describe('resolveSettlement', () => {
        it('should return empty object for null input', () => {
            expect(resolveSettlement(null)).toEqual({})
            expect(resolveSettlement(undefined)).toEqual({})
        })

        it('should resolve село type', () => {
            const localityLevel = {
                gar: [{
                    level: 'adminarea',
                    guid: 'test-guid',
                    area: {
                        type: 'село',
                        name: 'Иваново',
                    },
                    param: [
                        { '@_name': 'kladrcode', '#text': '1234567890' },
                    ],
                }],
            }

            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: 'Иваново',
                settlement_type: 'с',
                settlement_type_full: 'село',
                settlement_with_type: 'село Иваново',
                settlement_fias_id: 'test-guid',
                settlement_kladr_id: '1234567890',
            })
        })

        it('should resolve поселок type', () => {
            const localityLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'поселок',
                        name: 'Лесной',
                    },
                }],
            }

            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: 'Лесной',
                settlement_type: 'пос',
                settlement_type_full: 'поселок',
                settlement_with_type: 'поселок Лесной',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should default to деревня type', () => {
            const localityLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'unknown',
                        name: 'Петрово',
                    },
                }],
            }

            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: 'Петрово',
                settlement_type: 'д',
                settlement_type_full: 'деревня',
                settlement_with_type: 'деревня Петрово',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle missing area field', () => {
            const localityLevel = {
                gar: [{
                    level: 'adminarea',
                    guid: 'test-guid',
                }],
            }

            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: null,
                settlement_type: 'д',
                settlement_type_full: 'деревня',
                settlement_with_type: '',
                settlement_fias_id: 'test-guid',
                settlement_kladr_id: null,
            })
        })

        it('should handle empty gar array', () => {
            const localityLevel = {
                gar: [],
            }

            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: null,
                settlement_type: 'д',
                settlement_type_full: 'деревня',
                settlement_with_type: '',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle null area name', () => {
            const localityLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'село',
                        name: null,
                    },
                }],
            }

            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: null,
                settlement_type: 'с',
                settlement_type_full: 'село',
                settlement_with_type: '',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle деревня type explicitly', () => {
            const localityLevel = {
                gar: [{
                    area: {
                        type: 'деревня',
                        name: 'Петрово',
                    },
                }],
            }

            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: 'Петрово',
                settlement_type: 'д',
                settlement_type_full: 'деревня',
                settlement_with_type: 'деревня Петрово',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should resolve поселение type', () => {
            const localityLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'поселение',
                        name: 'Новое',
                    },
                }],
            }
            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: 'Новое',
                settlement_type: 'поселение',
                settlement_type_full: 'поселение',
                settlement_with_type: 'поселение Новое',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })

        it('should handle gar as a single object (not array)', () => {
            const localityLevel = {
                gar: {
                    level: 'adminarea',
                    area: {
                        type: 'село',
                        name: 'Старое',
                    },
                    guid: 'guid-123',
                    param: [
                        { '@_name': 'kladrcode', '#text': '555' },
                    ],
                },
            }
            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: 'Старое',
                settlement_type: 'с',
                settlement_type_full: 'село',
                settlement_with_type: 'село Старое',
                settlement_fias_id: 'guid-123',
                settlement_kladr_id: '555',
            })
        })

        it('should handle area.name as array', () => {
            const localityLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'село',
                        name: ['Первое', 'Второе'],
                    },
                }],
            }
            expect(resolveSettlement(localityLevel)).toEqual({
                settlement: 'Первое',
                settlement_type: 'с',
                settlement_type_full: 'село',
                settlement_with_type: 'село Первое',
                settlement_fias_id: null,
                settlement_kladr_id: null,
            })
        })
    })
})
