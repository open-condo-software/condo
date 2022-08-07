const { isArray, isObject, omit } = require('lodash')

/**
 * Omits property with given name from object / Array
 * @param obj will be transformed to another object without property with name `propToOmit` in any nested object and arrays
 * @param propToOmit name of property to recursively omit from `obj`
 * @return {*}
 */
const omitRecursively = (obj, propToOmit) => {
    if (isArray(obj)) {
        return obj.map((item) => omitRecursively(item, propToOmit))
    }
    if (!isObject(obj)) return obj
    const cleaned = omit(obj, propToOmit)
    return Object.assign({}, ...Object.keys(cleaned).map((key) => ({ [key]: omitRecursively(cleaned[key], propToOmit) })))
}

module.exports = {
    omitRecursively,
}