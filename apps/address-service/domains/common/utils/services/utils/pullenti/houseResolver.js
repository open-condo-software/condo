const { getGarParam, resolveTypes } = require('./helpers')

/**
 * @typedef {Object} HouseInfo
 * @property {string|null} house - The house number
 * @property {string|null} house_type - The type of the house (e.g., 'д', 'стр')
 * @property {string|null} house_type_full - The full type name of the house (e.g., 'дом', 'строение')
 * @property {string|null} house_fias_id - The FIAS ID of the house
 * @property {string|null} house_kladr_id - The KLADR ID of the house
 * @property {string|null} house_cadnum - The cadastre number of the house
 * @property {string|null} block - The block number
 * @property {string|null} block_type - The type of the block (e.g., 'корп')
 * @property {string|null} block_type_full - The full type name of the block (e.g., 'корпус')
 * @property {string|null} postal_code - The postal code associated with the house
 */

/**
 * Resolves the house information from a GAR object
 * @param {Object} gar - The GAR object containing house information
 * @returns {HouseInfo} An object containing the resolved house information
 */
function resolveHouse (gar) {
    const ret = {
        house: null,
        house_type: null,
        house_type_full: null,
        house_fias_id: null,
        house_kladr_id: null,
        house_cadnum: null,
        block: null,
        block_type: null,
        block_type_full: null,
        postal_code: null,
    }

    if (gar) {
        const house = gar?.house?.num || gar?.house?.snum || null
        const houseTypes = resolveTypes(gar?.house?.type || gar?.house?.stype)

        if (!!house && !!houseTypes) {
            const kladrCode = getGarParam(gar, 'kladrcode')
            const kadasterNumber = getGarParam(gar, 'kadasternumber')

            ret.house = String(house)
            ret.house_type = houseTypes.type
            ret.house_type_full = houseTypes.typeFull
            ret.house_fias_id = gar?.guid || null
            ret.house_kladr_id = kladrCode ? String(kladrCode) : null
            ret.house_cadnum = kadasterNumber ? String(kadasterNumber) : null
        }

        const block = gar?.house?.bnum || null

        if (block) {
            const blockTypes = resolveTypes('block')

            ret.block = String(block)
            ret.block_type = blockTypes.type
            ret.block_type_full = blockTypes.typeFull
        }

        const postIndex = getGarParam(gar, 'postindex')
        ret.postal_code = postIndex ? String(postIndex) : null
    }

    return ret
}

module.exports = { resolveHouse }
