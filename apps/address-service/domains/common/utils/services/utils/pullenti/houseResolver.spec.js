const { resolveHouse } = require('./houseResolver')

describe('houseResolver', () => {
    describe('resolveHouse', () => {
        it('should return all null fields for null or undefined input', () => {
            expect(resolveHouse(null)).toEqual({
                house: null,
                house_type: null,
                house_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
            expect(resolveHouse(undefined)).toEqual({
                house: null,
                house_type: null,
                house_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
        })

        it('should resolve house with all fields present', () => {
            const gar = {
                house: { num: 123, type: 'дом' },
                guid: 'test-guid',
                param: [
                    { '@_name': 'kladrcode', '#text': '1234567890' },
                    { '@_name': 'kadasternumber', '#text': 'kad-123' },
                    { '@_name': 'postindex', '#text': '123456' },
                ],
            }
            expect(resolveHouse(gar)).toEqual({
                house: '123',
                house_type: 'д',
                house_type_full: 'дом',
                house_fias_id: 'test-guid',
                house_kladr_id: '1234567890',
                house_cadnum: 'kad-123',
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: '123456',
            })
        })

        it('should resolve house with block', () => {
            const gar = {
                house: { num: 123, type: 'дом', bnum: '1A' },
            }
            expect(resolveHouse(gar)).toEqual({
                house: '123',
                house_type: 'д',
                house_type_full: 'дом',
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: '1A',
                block_type: 'корп',
                block_type_full: 'корпус',
                postal_code: null,
            })
        })

        it('should resolve house with numeric house and block', () => {
            const gar = {
                house: { num: 42, type: 'дом', bnum: 7 },
            }
            expect(resolveHouse(gar)).toEqual({
                house: '42',
                house_type: 'д',
                house_type_full: 'дом',
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: '7',
                block_type: 'корп',
                block_type_full: 'корпус',
                postal_code: null,
            })
        })

        it('should resolve house with snum if num is missing', () => {
            const gar = {
                house: { snum: 'ALT-42', type: 'дом' },
            }
            expect(resolveHouse(gar)).toEqual({
                house: 'ALT-42',
                house_type: 'д',
                house_type_full: 'дом',
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
        })

        it('should resolve house_type using stype if type is missing', () => {
            const gar = {
                house: { num: '5', stype: 'construction' },
            }
            expect(resolveHouse(gar)).toEqual({
                house: '5',
                house_type: 'соор',
                house_type_full: 'сооружение',
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
        })

        it('should resolve house_type using type if both type and stype are present and type is construction', () => {
            const gar = {
                house: { num: '7', type: 'construction', stype: 'somethingElse' },
            }
            expect(resolveHouse(gar)).toEqual({
                house: '7',
                house_type: 'соор',
                house_type_full: 'сооружение',
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
        })

        it('should resolve house with only guid and no house', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveHouse(gar)).toEqual({
                house: null,
                house_type: null,
                house_type_full: null,
                house_fias_id: null, // house_type is required for guid to be set
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
        })

        it('should resolve house with missing house number', () => {
            const gar = {
                house: { type: 'дом' },
            }
            expect(resolveHouse(gar)).toEqual({
                house: null,
                house_type: null,
                house_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
        })

        it('should resolve house with missing house_type', () => {
            const gar = {
                house: { num: '10' },
            }
            expect(resolveHouse(gar)).toEqual({
                house: null,
                house_type: null,
                house_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: null,
                block_type: null,
                block_type_full: null,
                postal_code: null,
            })
        })

        it('should resolve house with only block', () => {
            const gar = {
                house: { bnum: 'B2' },
            }
            expect(resolveHouse(gar)).toEqual({
                house: null,
                house_type: null,
                house_type_full: null,
                house_fias_id: null,
                house_kladr_id: null,
                house_cadnum: null,
                block: 'B2',
                block_type: 'корп',
                block_type_full: 'корпус',
                postal_code: null,
            })
        })
    })
})
