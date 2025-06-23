const { joinNameAndType, getGarParam, selfOrFirst, resolveTypes } = require('./helpers')

/** 
 * @typedef {Object} RegionInfo
 * @property {string|null} region - The name of the region
 * @property {string|null} region_type - The type of the region (e.g., 'обл', 'край', 'г')
 * @property {string|null} region_type_full - The full type name of the region (e.g., 'область', 'край', 'город')
 * @property {string|null} region_with_type - The region name combined with its type (e.g., 'г Москва', 'Краснодарский край')
 * @property {string|null} region_fias_id - The FIAS ID of the region
 * @property {string|null} region_kladr_id - The KLADR ID of the region
 */

/**
 * Resolves the region information from a GAR object
 * @param {Object} gar - The GAR object containing region information
 * @returns {RegionInfo} An object containing the resolved region information
 */
function resolveRegion (gar) {
    const ret = {
        region: null,
        region_type: null,
        region_type_full: null,
        region_with_type: null,
        region_fias_id: null,
        region_kladr_id: null,
    }

    if (gar) {
        /** @type {string|null} */
        const region = selfOrFirst(gar?.area?.name) || null
        const types = resolveTypes(gar?.area?.type)

        if (!!region && !!types) {
            ret.region = region
            ret.region_type = types.type
            ret.region_type_full = types.typeFull
            ret.region_with_type = joinNameAndType(region, types.type, types.isNameFirst)
            ret.region_fias_id = gar?.guid || null
            ret.region_kladr_id = getGarParam(gar, 'kladrcode') || null
        }
    }

    return ret
}

module.exports = { resolveRegion }
