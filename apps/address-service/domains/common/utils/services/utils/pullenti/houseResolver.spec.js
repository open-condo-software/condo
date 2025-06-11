const { resolveHouse } = require('./houseResolver')

describe('houseResolver', () => {
    describe('resolveHouse', () => {
        it('should return empty object for null input', () => {
            expect(resolveHouse(null)).toEqual({})
            expect(resolveHouse(undefined)).toEqual({})
        })

        it('should resolve house with all fields', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    house: { num: 123 },
                    guid: 'test-guid',
                    param: [
                        { '@_name': 'kladrcode', '#text': '1234567890' },
                        { '@_name': 'kadasternumber', '#text': 'kad-123' },
                        { '@_name': 'postindex', '#text': '123456' },
                    ],
                }],
            }

            expect(resolveHouse(houseLevel)).toEqual({
                house: '123',
                house_type: 'д',
                house_type_full: 'дом',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: 'test-guid',
                house_kladr_id: '1234567890',
                house_cadnum: 'kad-123',
                postal_code: '123456',
            })
        })

        it('should handle house with block number', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    house: {
                        num: 123,
                        bnum: '1A',
                    },
                }],
            }

            expect(resolveHouse(houseLevel)).toEqual({
                house: '123',
                house_type: 'д',
                house_type_full: 'дом',
                block: '1A',
                block_type: 'корп',
                block_type_full: 'корпус',
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })

        it('should handle missing GAR parameters', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    house: { num: 123 },
                }],
            }

            expect(resolveHouse(houseLevel)).toEqual({
                house: '123',
                house_type: 'д',
                house_type_full: 'дом',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })

        it('should handle missing house number', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    house: {},
                }],
            }

            expect(resolveHouse(houseLevel)).toEqual({
                house: null,
                house_type: 'д',
                house_type_full: 'дом',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })

        it('should convert numeric house and block numbers to strings', () => {
            const houseLevel = {
                gar: [{
                    house: {
                        num: 123,
                        bnum: 456,
                    },
                }],
            }

            expect(resolveHouse(houseLevel)).toEqual({
                house: '123',
                house_type: 'д',
                house_type_full: 'дом',
                block: '456',
                block_type: 'корп',
                block_type_full: 'корпус',
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })

        it('should handle missing house field in gar object', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    guid: 'test-guid',
                }],
            }

            expect(resolveHouse(houseLevel)).toEqual({
                house: null,
                house_type: 'д',
                house_type_full: 'дом',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: 'test-guid',
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })
        
        it('should handle empty gar array', () => {
            const houseLevel = {
                gar: [],
            }

            expect(resolveHouse(houseLevel)).toEqual({
                house: null,
                house_type: 'д',
                house_type_full: 'дом',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })

        it('should use snum if num is missing', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    house: { snum: 'ALT-42' },
                }],
            }
            expect(resolveHouse(houseLevel)).toEqual({
                house: 'ALT-42',
                house_type: 'д',
                house_type_full: 'дом',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })

        it('should use stype if type is missing', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    house: { num: '5', stype: 'construction' },
                }],
            }
            expect(resolveHouse(houseLevel)).toEqual({
                house: '5',
                house_type: 'соор',
                house_type_full: 'сооружение',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })

        it('should use type if both type and stype are present and type is construction', () => {
            const houseLevel = {
                gar: [{
                    level: 'building',
                    house: { num: '7', type: 'construction', stype: 'somethingElse' },
                }],
            }
            expect(resolveHouse(houseLevel)).toEqual({
                house: '7',
                house_type: 'соор',
                house_type_full: 'сооружение',
                block: null,
                block_type: null,
                block_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                postal_code: null,
            })
        })
    })
})
