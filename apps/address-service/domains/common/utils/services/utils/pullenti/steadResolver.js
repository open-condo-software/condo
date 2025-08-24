const { getGarParam, selfOrFirst, resolveTypes } = require('./helpers')

/**
 * @typedef {Object} SteadInfo
 * @property {string|null} stead - The name of the stead
 * @property {string|null} stead_type - The type of the stead (e.g., 'уч')
 * @property {string|null} stead_type_full - The full type name of the stead (e.g., 'участок')
 * @property {string|null} stead_fias_id - The FIAS ID of the stead
 * @property {string|null} stead_cadnum - The cadastral number of the stead
 */

/**
 * Resolves the stead information from a GAR object
 * @param {Object} gar - The GAR object containing stead information
 * @returns {SteadInfo} An object containing the resolved stead information
 */
function resolveStead (gar) {
    const ret = {
        stead: null,
        stead_type: null,
        stead_type_full: null,
        stead_fias_id: null,
        stead_cadnum: null,
    }

    if (gar) {
        /** @type {string|null} */
        const stead = selfOrFirst(gar?.house?.pnum) || null
        const types = resolveTypes('stead')

        if (!!stead && !!types) {
            ret.stead = String(stead)
            ret.stead_type = types.type
            ret.stead_type_full = types.typeFull
            ret.stead_fias_id = gar?.guid || null
            ret.stead_cadnum = getGarParam(gar, 'kadasternumber') || null
        }
    }

    return ret
}

module.exports = { resolveStead }
