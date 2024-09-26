/**
 * make normalized JSON
 * @param value
 * @returns {string}
 */
function canonicalize (value) {
    if (Array.isArray(value)) {
        return `[${value.map(canonicalize).join(',')}]`
    } else if (value !== null && value !== undefined && typeof value === 'object') {
        const keys = Object.keys(value).sort()
        const serializedKeyValues = keys.map(key => `"${key}":${canonicalize(value[key])}`).join(',')
        return `{${serializedKeyValues}}`
    } else {
        return JSON.stringify(value)
    }
}

module.exports = {
    canonicalize,
}
