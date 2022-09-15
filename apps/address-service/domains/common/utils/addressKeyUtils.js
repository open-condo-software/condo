const get = require('lodash/get')

/**
 * @param {NormalizedSuggestion} normalizedSuggestion
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
        .filter(Boolean)
        .map((part) => part.replaceAll(' ', '_'))
        .join(':')
        .toLowerCase()
}

module.exports = { generateAddressKey }
