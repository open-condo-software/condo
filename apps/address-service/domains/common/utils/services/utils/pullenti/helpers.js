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
 * Extracts a level from the textaddr object by its name.
 * @param {Object} item The item containing textaddr
 * @param {string} levelName The name of the level to extract
 * @returns {Object|null} The level object if found, otherwise null
 */
function getLevel (item, levelName) {
    if (!item || !item.textaddr || !Array.isArray(item.textaddr.textobj)) {
        return null
    }

    for (const level of item.textaddr.textobj) {
        if (level && level.level === levelName) {
            return level
        }
    }

    return null
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
 * Extracts the last FIAS ID from the textobj array
 * @param {Object[]} textobj Array of textobj objects
 * @returns {string|null} The last FIAS ID or null if not found
 * 
 * @example
 * // Example usage:
 * const textobj = [
 *   { gar: { guid: '123' } },
 *   { gar: { guid: '456' } },
 *   { gar: { guid: '789' } }
 * ]
 * const lastFiasId = extractLastFiasIs(textobj)
 * console.log(lastFiasId) // Output: '789'
 */
function extractLastFiasId (textobj = []) {
    let fiasId = null

    for (const level of textobj) {
        if (level.gar && level.gar.guid) {
            fiasId = level.gar.guid || fiasId
        }
    }

    return fiasId
}

/**
 * Extracts the last parameter value from the textobj array
 * @param {Object[]} textobj Array of textobj objects
 * @param {string} paramName Name of the parameter to extract (kladrcode, okato, oktmo, etc.)
 * @return {string|null} The last parameter value or null if not found
 * @example
 * // Example usage:
 * const textobj = [
 *   { gar: { param: [{ '@_name': 'kladrcode', '#text': '1234567890' }] } },
 *   { gar: { param: [{ '@_name': 'kladrcode', '#text': '0987654321' }] } }
 * ]
 * const lastKladrId = extractLastParam(textobj, 'kladrcode')
 * console.log(lastKladrId) // Output: '0987654321'
 */
function extractLastGarParam (textobj, paramName) {
    let value = null

    for (const level of textobj || []) {
        if (level?.gar) {
            value = getGarParam(level.gar, paramName) || value
        }
    }

    return value
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

module.exports = { joinNameAndType, selfOrFirst, getLevel, getGarLevel, getGarParam, extractLastFiasId, extractLastGarParam }
