const { isPlainObject } = require('lodash')

/**
 * Checks if query has fieldName property on any level of depth
 * @param {Object} whereQuery
 * @param {string} fieldName
 * @return {boolean}
 */
function queryHasField (whereQuery, fieldName) {
    // undefined case
    if (!whereQuery) return false
    // { deletedAt: null } case
    if (Object.keys(whereQuery).find((x) => x.startsWith(fieldName))) {
        return true
    }
    for (const queryValue of Object.values(whereQuery)) {
        // OR: [ { deletedAt: null }, { ... } ] case
        if (Array.isArray(queryValue)) {
            for (const innerQuery of queryValue) {
                if (queryHasField(innerQuery, fieldName))
                    return true
            }
        // property: { deletedAt: null } case
        } else if (isPlainObject(queryValue)){
            if (queryHasField(queryValue, fieldName)) {
                return true
            }
        }
    }
    return false
}

module.exports = {
    queryHasField,
}