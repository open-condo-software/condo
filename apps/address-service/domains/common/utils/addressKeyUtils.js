const get = require('lodash/get')

const JOINER = '~'
const SPACE_REPLACER = '_'
const SPECIAL_SYMBOLS_TO_REMOVE_REGEX = /[!@#$%^&*)(+=.,_:;"'`[\]{}№|<>~]/g

/**
 * @param {NormalizedBuilding} normalizedBuilding
 * @returns {string}
 */
function generateAddressKey (normalizedBuilding) {
    const data = normalizedBuilding.data
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

module.exports = { generateAddressKey, JOINER, SPACE_REPLACER }
