const { joinNameAndType, getGarParam, selfOrFirst, resolveTypes } = require('./helpers')

/**
 * @typedef {Object} CityDistrictInfo
 * @property {string|null} city_district - The name of the city district
 * @property {string|null} city_district_type - The type of the city district (e.g., 'г', 'пгт', 'р-н')
 * @property {string|null} city_district_type_full - The full type name of the city district (e.g., 'город', 'поселок городского типа', 'район')
 * @property {string|null} city_district_with_type - The city district name combined with its type (e.g., 'г Москва', 'пгт Красное Село')
 * @property {string|null} city_district_fias_id - The FIAS ID of the city district
 * @property {string|null} city_district_kladr_id - The KLADR ID of the city district
 */

/**
 * Resolves the city district information from a GAR object
 * @param {Object} gar - The GAR object containing city district information
 * @returns {CityDistrictInfo} An object containing the resolved city district information
 */
function resolveCityDistrict (gar) {
    const ret = {
        city_district: null,
        city_district_type: null,
        city_district_type_full: null,
        city_district_with_type: null,
        city_district_fias_id: null,
        city_district_kladr_id: null,
    }

    if (gar) {
        /** @type {string|null} */
        const cityDistrict = selfOrFirst(gar?.area?.name) || null
        const types = resolveTypes(gar?.area?.type)

        if (!!cityDistrict && !!types) {
            ret.city_district = cityDistrict
            ret.city_district_type = types.type
            ret.city_district_type_full = types.typeFull
            ret.city_district_with_type = joinNameAndType(cityDistrict, types.type, types.isNameFirst)
            ret.city_district_fias_id = gar?.guid || null
            ret.city_district_kladr_id = getGarParam(gar, 'kladrcode') || null
        }
    }

    return ret
}

module.exports = { resolveCityDistrict }
