const { resolveCityDistrict } = require('./cityDistrictResolver')

describe('cityDistrictResolver', () => {
    describe('resolveCityDistrict', () => {
        it('should return empty object for null input', () => {
            expect(resolveCityDistrict(null)).toEqual({})
            expect(resolveCityDistrict(undefined)).toEqual({})
        })

        it('should resolve район type', () => {
            const districtLevel = {
                gar: [{
                    level: 'adminarea',
                    guid: 'test-guid',
                    area: {
                        type: 'район',
                        name: 'Ленинский',
                    },
                    param: [
                        { '@_name': 'kladrcode', '#text': '1234567890' },
                    ],
                }],
            }

            expect(resolveCityDistrict(districtLevel)).toEqual({
                city_district: 'Ленинский',
                city_district_type: 'р-н',
                city_district_type_full: 'район',
                city_district_with_type: 'район Ленинский',
                city_district_fias_id: 'test-guid',
                city_district_kladr_id: '1234567890',
            })
        })

        it('should resolve муниципальный округ type', () => {
            const districtLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'муниципальный округ',
                        name: 'Южный',
                    },
                }],
            }

            expect(resolveCityDistrict(districtLevel)).toEqual({
                city_district: 'Южный',
                city_district_type: 'муницип окр',
                city_district_type_full: 'муниципальный округ',
                city_district_with_type: 'муниципальный округ Южный',
                city_district_fias_id: null,
                city_district_kladr_id: null,
            })
        })

        it('should handle missing area field', () => {
            const districtLevel = {
                gar: [{
                    level: 'adminarea',
                    guid: 'test-guid',
                }],
            }

            expect(resolveCityDistrict(districtLevel)).toEqual({
                city_district: null,
                city_district_type: 'р-н',
                city_district_type_full: 'район',
                city_district_with_type: '',
                city_district_fias_id: 'test-guid',
                city_district_kladr_id: null,
            })
        })

        it('should handle unknown area type', () => {
            const districtLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'unknown-type',
                        name: 'Test',
                    },
                }],
            }

            expect(resolveCityDistrict(districtLevel)).toEqual({
                city_district: 'Test',
                city_district_type: 'р-н',
                city_district_type_full: 'район',
                city_district_with_type: 'район Test',
                city_district_fias_id: null,
                city_district_kladr_id: null,
            })
        })

        it('should handle null area name', () => {
            const districtLevel = {
                gar: [{
                    level: 'adminarea',
                    area: {
                        type: 'район',
                        name: null,
                    },
                }],
            }

            expect(resolveCityDistrict(districtLevel)).toEqual({
                city_district: null,
                city_district_type: 'р-н',
                city_district_type_full: 'район',
                city_district_with_type: '',
                city_district_fias_id: null,
                city_district_kladr_id: null,
            })
        })
    })
})
