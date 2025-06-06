const { resolveStreet } = require('./streetResolver')

describe('streetResolver', () => {
    describe('resolveStreet', () => {
        it('should return empty object for null input', () => {
            expect(resolveStreet(null)).toEqual({})
            expect(resolveStreet(undefined)).toEqual({})
        })

        it('should resolve улица type', () => {
            const streetLevel = {
                gar: [{
                    level: 'street',
                    guid: 'test-guid',
                    area: {
                        type: 'улица',
                        name: 'Ленина',
                    },
                    param: [
                        { '@_name': 'kladrcode', '#text': '1234567890' },
                    ],
                }],
            }

            expect(resolveStreet(streetLevel)).toEqual({
                street: 'Ленина',
                street_type: 'ул',
                street_type_full: 'улица',
                street_with_type: 'ул Ленина',
                street_fias_id: 'test-guid',
                street_kladr_id: '1234567890',
            })
        })

        it('should resolve проспект type', () => {
            const streetLevel = {
                gar: [{
                    level: 'street',
                    area: {
                        type: 'проспект',
                        name: 'Невский',
                    },
                }],
            }

            expect(resolveStreet(streetLevel)).toEqual({
                street: 'Невский',
                street_type: 'просп',
                street_type_full: 'проспект',
                street_with_type: 'просп Невский',
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should resolve просп type', () => {
            const streetLevel = {
                gar: [{
                    level: 'street',
                    area: {
                        type: 'просп',
                        name: 'Ленинский',
                    },
                }],
            }

            expect(resolveStreet(streetLevel)).toEqual({
                street: 'Ленинский',
                street_type: 'просп',
                street_type_full: 'проспект',
                street_with_type: 'просп Ленинский',
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should handle missing area field', () => {
            const streetLevel = {
                gar: [{
                    level: 'street',
                    guid: 'test-guid',
                }],
            }

            expect(resolveStreet(streetLevel)).toEqual({
                street: null,
                street_type: 'ул',
                street_type_full: 'улица',
                street_with_type: '',
                street_fias_id: 'test-guid',
                street_kladr_id: null,
            })
        })

        it('should handle null area name', () => {
            const streetLevel = {
                gar: [{
                    level: 'street',
                    area: {
                        type: 'улица',
                        name: null,
                    },
                }],
            }

            expect(resolveStreet(streetLevel)).toEqual({
                street: null,
                street_type: 'ул',
                street_type_full: 'улица',
                street_with_type: '',
                street_fias_id: null,
                street_kladr_id: null,
            })
        })

        it('should handle empty gar array', () => {
            const streetLevel = {
                gar: [],
            }

            expect(resolveStreet(streetLevel)).toEqual({
                street: null,
                street_type: 'ул',
                street_type_full: 'улица',
                street_with_type: '',
                street_fias_id: null,
                street_kladr_id: null,
            })
        })
    })
})
