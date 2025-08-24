const { resolveCityDistrict } = require('./cityDistrictResolver')

describe('cityDistrictResolver', () => {
    describe('resolveCityDistrict', () => {
        const nullishCityDistrict = {
            city_district: null,
            city_district_type: null,
            city_district_type_full: null,
            city_district_with_type: null,
            city_district_fias_id: null,
            city_district_kladr_id: null,
        }

        it('should return all null fields for null or undefined input', () => {
            expect(resolveCityDistrict(null)).toEqual(nullishCityDistrict)
            expect(resolveCityDistrict(undefined)).toEqual(nullishCityDistrict)
        })

        it('should resolve all fields when area.name and recognized type are present', () => {
            const gar = {
                area: {
                    type: 'район',
                    name: 'Ленинский',
                },
                guid: 'test-guid',
                param: [
                    { '@_name': 'kladrcode', '#text': '1234567890' },
                ],
            }
            expect(resolveCityDistrict(gar)).toEqual({
                city_district: 'Ленинский',
                city_district_type: 'р-н',
                city_district_type_full: 'район',
                city_district_with_type: 'Ленинский р-н',
                city_district_fias_id: 'test-guid',
                city_district_kladr_id: '1234567890',
            })
        })

        it('should return all null fields if area is missing', () => {
            const gar = {
                guid: 'test-guid',
            }
            expect(resolveCityDistrict(gar)).toEqual(nullishCityDistrict)
        })

        it('should return all null fields if area.name is missing', () => {
            const gar = {
                area: {
                    type: 'район',
                },
            }
            expect(resolveCityDistrict(gar)).toEqual(nullishCityDistrict)
        })

        it('should return all null fields if area.type is not recognized', () => {
            const gar = {
                area: {
                    type: 'unknown-type',
                    name: 'Test',
                },
            }
            expect(resolveCityDistrict(gar)).toEqual(nullishCityDistrict)
        })

        it('should return all null fields if area.name is null', () => {
            const gar = {
                area: {
                    type: 'район',
                    name: null,
                },
            }
            expect(resolveCityDistrict(gar)).toEqual(nullishCityDistrict)
        })
    })
})
