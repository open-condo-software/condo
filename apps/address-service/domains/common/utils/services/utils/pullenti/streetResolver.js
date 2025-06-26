const { joinNameAndType, getGarParam, selfOrFirst, resolveTypes } = require('./helpers')

/**
 * @typedef {Object} StreetInfo
 * @property {string|null} street - The name of the street
 * @property {string|null} street_type - The type of the street (e.g., 'ул', 'пр-кт', 'д')
 * @property {string|null} street_type_full - The full type name of the street (e.g., 'улица', 'проспект', 'дом')
 * @property {string|null} street_with_type - The street name combined with its type (e.g., 'ул Ленина', 'пр-кт Мира')
 * @property {string|null} street_fias_id - The FIAS ID of the street
 * @property {string|null} street_kladr_id - The KLADR ID of the street
 */

/**
 * Resolves the street information from a GAR object
 * @param {Object} gar - The GAR object containing street information
 * @returns {StreetInfo} An object containing the resolved street information
 */
function resolveStreet (gar) {
    const ret = {
        street: null,
        street_type: null,
        street_type_full: null,
        street_with_type: null,
        street_fias_id: null,
        street_kladr_id: null,
    }

    if (gar) {
        /** @type {string|null} */
        const street = selfOrFirst(gar.area?.name) || null
        const types = resolveTypes(gar.area?.type)

        if (!!street && !!types) {
            ret.street = street
            ret.street_type = types.type
            ret.street_type_full = types.typeFull
            ret.street_with_type = joinNameAndType(street, types.type, types.isNameFirst)
            ret.street_fias_id = gar.guid || null
            ret.street_kladr_id = getGarParam(gar, 'kladrcode') || null
        }
    }

    return ret
}

module.exports = { resolveStreet }
