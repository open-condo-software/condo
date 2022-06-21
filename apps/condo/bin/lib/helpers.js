const { get, isString, isObjectLike, isEmpty } = require('lodash')

/**
 * Extracts unique field values from array of objects by given path
 * Can also extract nested subfields if value on path is JSON/Object and jsonFieldPath provided
 * @param list [{}]
 * @param fieldPath
 * @param jsonFieldPath
 * @returns {unknown[]}
 */
const getUniqueByField = (list, fieldPath, jsonFieldPath) => {
    const itemsSet = list.reduce((result, item) => {
        const value = get(item, fieldPath)

        try {
            let valueToAdd = value
            const hasNestedValue = jsonFieldPath && (isString(value) || isObjectLike(value))

            if (hasNestedValue) {
                const source = isString(value) ? JSON.parse(value) : value

                valueToAdd = get(source, jsonFieldPath)
            }

            /**
             * Extracted value is non empty object/array/scalar
             */
            const shouldAdd = isObjectLike(valueToAdd) && !isEmpty(valueToAdd) || !isObjectLike(valueToAdd) && valueToAdd

            if (shouldAdd) result.add(valueToAdd)
        } catch (err) {
            console.info('[INFO]', { item, fieldPath, jsonFieldPath, value })
            console.error(err)
        }

        return result
    }, new Set())

    return [...itemsSet]
}

/**
 * Maps array of entities_1 connected to entities_2 as a dictionary of { [<entity_1_X>] : [<entity_2_Y>, <entity_2_Z>, ...], ... }
 * Different entities mapped to the same key will be stored as an array
 * @param items [{}]
 * @param connection
 */
const getConnectionsMapping = (items, connection, full = false) => items.reduce(
    (acc, item) => {
        const key = get(item, connection)

        if (key) {
            if (!acc[key]) acc[key] = []

            acc[key].push(full ? item : get(item, 'id'))
        }

        return acc
    },
    {}
)

module.exports = {
    getUniqueByField,
    getConnectionsMapping,
}
