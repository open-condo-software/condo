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
 * @param {Object|Object[]} objOrArray
 * @returns {Object}
 */
function selfOrFirst (objOrArray) {
    if (Array.isArray(objOrArray)) {
        return objOrArray[0]
    } return objOrArray
}

function getGarLevel (levelGar, level = null) {
    if (!Array.isArray(levelGar)) return levelGar

    for (const gar of levelGar || []) {
        if (gar.level === level) {
            return gar
        }
    }

    return selfOrFirst(levelGar)
}

function getGarParam (gar, paramName) {
    for (const param of gar?.param || []) {
        if (param['@_name'] === paramName) {
            return param['#text']
        }
    }
}

module.exports = { joinNameAndType, selfOrFirst, getGarLevel, getGarParam }
