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
 * Returns the first element of an array or the object itself if it's not an array.
 * If the array is empty, returns null.
 * @param {unknown|unknown[]} objOrArray
 * @returns {unknown|null}
 */
function selfOrFirst (objOrArray) {
    if (Array.isArray(objOrArray)) {
        return objOrArray[0] || null
    }

    return objOrArray
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
 * Extracts a GAR object from the specified level name and GAR level name
 * @param {Object} item The item containing textaddr
 * @param {string} levelName The name of the level to extract
 * @param {string} garLevelName The GAR level name to search for
 * @returns {Object|null} The GAR object if found, otherwise null
 * @example
 * // Example usage:
 * const item = {
 *   textaddr: {
 *     textobj: [
 *       { level: 'region', gar: [{ level: 'region', name: 'Region Name' }, { level: 'adminarea', name: 'Admin Area' }] },
 *       { level: 'city', gar: { level: 'city', name: 'City Name' } },
 *       { level: 'gar', gar: { level: 'gar', name: 'GAR Name' } }
 *     ]
 *  }
 * }
 * const gar = getGar(item, 'region', 'region')
 * console.log(gar) // Output: { level: 'region', name: 'Region Name' }
 */
function getGar (item, levelName, garLevelName) {
    let textObjLevel = getLevel(item, levelName)

    if (!textObjLevel || !textObjLevel.gar) {
        return null
    }

    let gars = Array.isArray(textObjLevel.gar) ? textObjLevel.gar : [textObjLevel.gar]

    for (const gar of gars) {
        if (gar?.level === garLevelName) {
            return gar
        }
    }

    return null
}

/** 
 * @typedef {Object} ResolvedTypes
 * @property {string} type - The short type code (e.g., 'обл', 'г', 'пгт')
 * @property {string} typeFull - The full type name (e.g., 'область', 'город', 'поселок городского типа')
 * @property {boolean} isNameFirst - Indicates if the name should be placed before the type in the formatted string
 */

/**
 * Resolves the type and full type name based on the provided type string
 * @param {string} type The type string to resolve
 * @returns {ResolvedTypes|null} An object containing the resolved type and full type name, or null if the type is not recognized
 * @example
 * // Example usage:
 * const resolvedType = resolveTypes('город')
 * console.log(resolvedType) // Output: { type: 'г', typeFull: 'город', isNameFirst: false }
 */
function resolveTypes (type) {
    switch (type) {
        case 'область':
            return { type: 'обл', typeFull: 'область', isNameFirst: true }
        case 'край':
            return { type: 'кр', typeFull: 'край', isNameFirst: true }
        case 'муниципальный округ':
            return { type: 'муницип окр', typeFull: 'муниципальный округ', isNameFirst: false }
        case 'городской округ':
            return { type: 'гор окр', typeFull: 'городской округ', isNameFirst: true }
        case 'город':
            return { type: 'г', typeFull: 'город', isNameFirst: false }
        case 'пгт':
            return { type: 'пгт', typeFull: 'поселок городского типа', isNameFirst: false }
        case 'поселок':
            return { type: 'пос', typeFull: 'поселок', isNameFirst: false }
        case 'поселение':
            return { type: 'п', typeFull: 'поселение', isNameFirst: false }
        case 'район':
            return { type: 'р-н', typeFull: 'район', isNameFirst: true }
        case 'село':
            return { type: 'с', typeFull: 'село', isNameFirst: false }
        case 'деревня':
            return { type: 'д', typeFull: 'деревня', isNameFirst: false }
        case 'улица':
            return { type: 'ул', typeFull: 'улица', isNameFirst: false }
        case 'просп':
        case 'проспект':
            return { type: 'пр-кт', typeFull: 'проспект', isNameFirst: false }
        case 'уч':
        case 'участок':
        case 'stead':
            return { type: 'уч', typeFull: 'участок', isNameFirst: false }
        case 'дом':
        case 'house':
            return { type: 'д', typeFull: 'дом', isNameFirst: false }
        case 'строение':
            return { type: 'стр', typeFull: 'строение', isNameFirst: false }
        case 'соор':
        case 'сооружение':
        case 'construction':
            return { type: 'соор', typeFull: 'сооружение', isNameFirst: false }
        case 'корпус':
        case 'block':
            return { type: 'корп', typeFull: 'корпус', isNameFirst: false }
        case 'квартира':
        case 'flat':
            return { type: 'кв', typeFull: 'квартира', isNameFirst: false }
        case 'апартаменты':
        case 'apartment':
            return { type: 'апарт', typeFull: 'апартаменты', isNameFirst: false }
        case 'офис':
            return { type: 'оф', typeFull: 'офис', isNameFirst: false }
        case 'комната':
            return { type: 'ком', typeFull: 'комната', isNameFirst: false }
        case 'машиноместо':
            return { type: 'мм', typeFull: 'машиноместо', isNameFirst: false }
        default:
            return null
    }
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
            return String(param['#text'])
        }
    }
}

module.exports = {
    joinNameAndType,
    selfOrFirst,
    getLevel,
    // getGarLevel,
    getGar,
    getGarParam,
    extractLastFiasId,
    extractLastGarParam,
    resolveTypes,
}
