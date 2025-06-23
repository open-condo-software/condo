const { joinNameAndType, getGarParam, selfOrFirst, resolveTypes } = require('./helpers')

/**
 * @typedef {Object} SettlementInfo
 * @property {string|null} settlement - The name of the settlement
 * @property {string|null} settlement_type - The type of the settlement (e.g., 'г', 'пгт', 'с')
 * @property {string|null} settlement_type_full - The full type name of the settlement (e.g., 'город', 'поселок городского типа', 'село')
 * @property {string|null} settlement_with_type - The settlement name combined with its type (e.g., 'г Москва', 'пгт Красное Село')
 * @property {string|null} settlement_fias_id - The FIAS ID of the settlement
 * @property {string|null} settlement_kladr_id - The KLADR ID of the settlement
 */

/**
 * Resolves the settlement information from a GAR object
 * @param {Object} gar - The GAR object containing settlement information
 * @returns {SettlementInfo} An object containing the resolved settlement information
 */
function resolveSettlement (gar) {
    const ret = {
        settlement: null,
        settlement_type: null,
        settlement_type_full: null,
        settlement_with_type: null,
        settlement_fias_id: null,
        settlement_kladr_id: null,
    }

    if (gar) {
        /** @type {string|null} */
        const settlement = selfOrFirst(gar?.area?.name) || null
        const types = resolveTypes(gar?.area?.type)

        if (!!settlement && !!types) {
            ret.settlement = settlement
            ret.settlement_type = types.type
            ret.settlement_type_full = types.typeFull
            ret.settlement_with_type = joinNameAndType(settlement, types.typeFull, types.isNameFirst)
            ret.settlement_fias_id = gar?.guid || null
            ret.settlement_kladr_id = getGarParam(gar, 'kladrcode') || null
        }
    }

    return ret
}

module.exports = { resolveSettlement }
