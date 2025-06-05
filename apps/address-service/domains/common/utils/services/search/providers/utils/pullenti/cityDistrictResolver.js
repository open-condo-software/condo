const { joinNameAndType, getGarLevel, getGarParam } = require('./helpers')

function resolveCityDistrict (districtLevel) {
    if (!districtLevel) return {}

    const gar = getGarLevel(districtLevel.gar, 'adminarea')
    const city_district = gar?.area?.name || null
    let city_district_type = 'р-н'
    let city_district_type_full = 'район'

    let isNameFirst = false

    switch (gar.area?.type) {
        case 'муниципальный округ':
            city_district_type = 'муницип окр'
            city_district_type_full = 'муниципальный округ'
    }

    return {
        city_district_fias_id: gar.guid || null,
        city_district_kladr_id: getGarParam(gar, 'kladrcode') || null,
        city_district_with_type: joinNameAndType(city_district, city_district_type_full, isNameFirst),
        city_district_type,
        city_district_type_full,
        city_district,
    }
}

module.exports = { resolveCityDistrict }
