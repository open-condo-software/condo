const { getGarParam, resolveTypes } = require('./helpers')
/**
 * @typedef {Object} FlatInfo
 * @property {string|null} flat - The flat number
 * @property {string|null} flat_type - The type of the flat (e.g., 'кв', 'ком')
 * @property {string|null} flat_type_full - The full type name of the flat (e.g., 'квартира', 'комната')
 * @property {string|null} flat_fias_id - The FIAS ID of the flat
 * @property {string|null} flat_cadnum - The cadastre number of the flat
 */

/**
 * Resolves the flat information from a GAR object
 * @param {Object} gar - The GAR object containing flat information
 * @returns {FlatInfo} An object containing the resolved flat information
 */
function resolveFlat (gar) {
    const ret = {
        flat: null,
        flat_type: null,
        flat_type_full: null,
        flat_fias_id: null,
        flat_cadnum: null,
    }

    if (gar) {
        const flat = gar?.room?.num || null
        const types = resolveTypes(gar?.room?.type)

        if (!!flat && !!types) {
            ret.flat = String(flat)
            ret.flat_type = types.type
            ret.flat_type_full = types.typeFull
            ret.flat_fias_id = gar?.guid || null
            ret.flat_cadnum = getGarParam(gar, 'kadasternumber') || null
        }
    }

    return ret
}

module.exports = { resolveFlat }
