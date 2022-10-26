const get = require('lodash/get')

const JOINER = '~'
const SPACE_REPLACER = '_'

/**
 * @param {NormalizedBuilding} normalizedSuggestion
 * @returns {string}
 */
function generateAddressKey (normalizedSuggestion) {
    const data = normalizedSuggestion.data
    /**
     * @type {string[]}
     */
    const parts = [
        get(data, 'country'),
        get(data, 'region'),
        get(data, 'area'),
        get(data, 'city'),
        get(data, 'settlement'),
        get(data, 'street'),
        get(data, 'building'),
        get(data, 'block'),
    ]
    return parts
        // Remove empty parts
        .filter(Boolean)
        // Keep single space between words
        .map(
            (part) => (
                String(part)
                    .split(/\s/)
                    .map((word) => word.trim())
                    .filter(Boolean)
                    .join(' ')
                    .replaceAll(/\s/g, SPACE_REPLACER)
            ),
        )
        // Remove newly appeared empty parts
        .filter(Boolean)
        .join(JOINER)
        .toLowerCase()
}

module.exports = { generateAddressKey, JOINER, SPACE_REPLACER }
