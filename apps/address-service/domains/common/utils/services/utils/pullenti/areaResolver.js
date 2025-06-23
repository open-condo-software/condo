const { joinNameAndType, getGarParam, selfOrFirst, resolveTypes } = require('./helpers')
/**
 * @typedef {Object} AreaInfo
 * @property {string|null} area - The name of the area
 * @property {string|null} area_type - The type of the area (e.g., 'р-н', 'обл')
 * @property {string|null} area_type_full - The full type name of the area (e.g., 'район', 'область')
 * @property {string|null} area_with_type - The area name combined with its type (e.g., 'р-н Москва', 'обл Краснодарский край')
 * @property {string|null} area_fias_id - The FIAS ID of the area
 * @property {string|null} area_kladr_id - The KLADR ID of the area
 */

/**
 * Resolves the area information from a GAR object
 * @param {Object} gar - The GAR object containing area information
 * @returns {AreaInfo} An object containing the resolved area information
 */
function resolveArea (gar) {
    const ret = {
        area: null,
        area_type: null,
        area_type_full: null,
        area_with_type: null,
        area_fias_id: null,
        area_kladr_id: null,
    }
    if (gar) {
        /** @type {string|null} */
        const area = selfOrFirst(gar?.area?.name) || null
        const types = resolveTypes(gar?.area?.type)

        if (!!area && !!types) {
            ret.area = area
            ret.area_type = types.type
            ret.area_type_full = types.typeFull
            ret.area_with_type = joinNameAndType(area, types.type, types.isNameFirst)
            ret.area_fias_id = gar?.guid || null
            ret.area_kladr_id = getGarParam(gar, 'kladrcode') || null
        }
    }

    return ret
}

module.exports = { resolveArea }
