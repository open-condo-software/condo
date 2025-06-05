/**
 * Joins name and type with space
 * @param {string} name
 * @param {string} type
 * @param {boolean} [isNameFirst=true]
 * @returns {string}
 */
function joinNameAndType (name, type, isNameFirst = true) {
    if (!name || !type) return ''

    return isNameFirst ? `${name} ${type}` : `${type} ${name}`
}

/**
 * Returns the first element if input is an array, otherwise returns the input itself
 * @param {Object|Object[]} objOrArray
 * @returns {Object}
 */
function selfOrFirst (objOrArray) {
    if (Array.isArray(objOrArray)) {
        return objOrArray[0]
    } return objOrArray
}

/**
 * Extracts a GAR level object from either a single object or array of objects
 * @param {Object|Object[]} levelGar - GAR level data (single object or array)
 * @param {string|null} [level=null] - Specific level to search for in array
 * @returns {Object} The matching GAR level object or first available object
 */
function getGarLevel (levelGar, level = null) {
    if (!Array.isArray(levelGar)) return levelGar

    for (const gar of levelGar || []) {
        if (gar.level === level) {
            return gar
        }
    }

    return selfOrFirst(levelGar)
}

/**
 * Extracts a parameter value by name from a GAR object's param array
 * @param {Object} gar - GAR object containing param array
 * @param {string} paramName - Name of the parameter to extract
 * @returns {string|undefined} The parameter value or undefined if not found
 */
function getGarParam (gar, paramName) {
    for (const param of gar?.param || []) {
        if (param['@_name'] === paramName) {
            return param['#text']
        }
    }
}

module.exports = { joinNameAndType, selfOrFirst, getGarLevel, getGarParam }
