import { isArray, isObject, omit, transform } from 'lodash'

/**
 * Omits property with given name from object
 * @param obj will be transformed to another object without property with name `propToOmit` in any nested object and arrays
 * @param propToOmit name of property to recursively omit from `obj`
 * @return {*}
 */
export const omitRecursively = (obj, propToOmit) => {
    const cleanedObj = omit(obj, propToOmit)
    return transform(
        cleanedObj,
        (result, value, key) =>
            (result[key] =
                isObject(value) && propToOmit in value
                    ? omitRecursively(value, propToOmit)
                    : isArray(value)
                    ? value.map((item) => omitRecursively(item, propToOmit))
                    : value),
    )
}
