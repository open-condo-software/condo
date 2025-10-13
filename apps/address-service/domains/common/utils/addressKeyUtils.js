const get = require('lodash/get')

const { FIAS_PROVIDERS } = require('../constants/providers')

const JOINER = '~'
const SPACE_REPLACER = '_'
const SPECIAL_SYMBOLS_TO_REMOVE_REGEX = /[!@#$%^&*)(+=.,_:;"'`[\]{}№|<>~]/g

/**
 * @param {import('@address-service/domains/common/utils/services/index.js').NormalizedBuilding} normalizedBuilding
 * @returns {string}
 */
function generateAddressKey (normalizedBuilding) {
    const data = normalizedBuilding.data
    const providerName = normalizedBuilding.provider?.name

    // FIAS providers' result always contain unique identifier of the building (FIAS ID)
    // So, it's useful to use such id as unique key for the address.
    // Also, such id gives an ability to get the same address from different providers.
    if (FIAS_PROVIDERS.includes(providerName)) {
        const key = generateAddressKeyFromFiasId(normalizedBuilding)

        if (key) {
            return key
        }
    }

    // The next logic is used as fallback.
    // It's not the best way, but it's the only way to get unique key for the address.

    /**
     * @type {string[]}
     */
    const parts = [
        get(data, 'country'),
        get(data, 'region'),
        get(data, 'area'),
        get(data, 'city'),
        get(data, 'city_district'),
        get(data, 'settlement'),
        get(data, 'street_type_full'),
        get(data, 'street'),
        get(data, 'house'),
        get(data, 'block_type_full'),
        get(data, 'block'),
    ]

    return parts
        // Remove empty parts
        .filter(Boolean)
        // Keep single space between words
        .map(
            (part) => (
                String(part)
                    .replace(SPECIAL_SYMBOLS_TO_REMOVE_REGEX, '')
                    .split(/\s/)
                    .filter((word) => Boolean(word.trim()))
                    .join(' ')
                    .replace(/\s/g, SPACE_REPLACER)
            ),
        )
        // Remove newly appeared empty parts
        .filter(Boolean)
        .join(JOINER)
        .toLowerCase()
}

/**
 * @param {NormalizedBuilding} normalizedBuilding
 * @returns {string | null}
 */
function generateAddressKeyFromFiasId (normalizedBuilding) {
    const houseFiasId = normalizedBuilding.data.house_fias_id

    if (!houseFiasId) {
        return null
    }

    return `fias:${houseFiasId}`
}

module.exports = { generateAddressKey, generateAddressKeyFromFiasId, JOINER, SPACE_REPLACER }
