const { joinNameAndType, getGarParam, selfOrFirst, resolveTypes } = require('./helpers')

/**
 * @typedef {Object} CityInfo
 * @property {string|null} city - The name of the city
 * @property {string|null} city_type - The type of the city (e.g., 'г', 'пгт', 'пос')
 * @property {string|null} city_type_full - The full type name of the city (e.g., 'город', 'поселок городского типа', 'поселок')
 * @property {string|null} city_with_type - The city name combined with its type (e.g., 'г Москва', 'пгт Краснодарский край')
 * @property {string|null} city_fias_id - The FIAS ID of the city
 * @property {string|null} city_kladr_id - The KLADR ID of the city
 */

/**
 * Resolves the city information from a GAR object
 * @param {Object} gar - The GAR object containing city information
 * @returns {CityInfo} An object containing the resolved city information
 */
function resolveCity (gar) {
    const ret = {
        city: null,
        city_type: null,
        city_type_full: null,
        city_with_type: null,
        city_fias_id: null,
        city_kladr_id: null,
    }
    if (gar) {
        /** @type {string|null} */
        const city = selfOrFirst(gar?.area?.name) || null
        const types = resolveTypes(gar?.area?.type)

        if (!!city && !!types) {
            ret.city = city
            ret.city_type = types.type
            ret.city_type_full = types.typeFull
            ret.city_with_type = joinNameAndType(city, types.type, types.isNameFirst)
            ret.city_fias_id = gar?.guid || null
            ret.city_kladr_id = getGarParam(gar, 'kladrcode') || null
        }
    }

    return ret
}

module.exports = { resolveCity }
