const { get, isString, isObjectLike, isEmpty } = require('lodash')
const dayjs = require('dayjs')

const { DATE_FORMAT } = require('./constants')

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
 * Maps array of entities connected to other entities as a dictionary of { [<userIdX>] : [<entityIdY>, <entityIdZ>, ...], ... }
 * Different entities mapped to the same key will be stored as an array
 * @param items [{}]
 * @param connection
 */
const getConnectionsMapping = (items, connection) => items.reduce(
    (acc, item) => {
        const key = get(item, connection)

        if (key) {
            if (!acc[key]) acc[key] = []
            acc[key].push(get(item, 'id'))
        }

        return acc
    },
    {}
)

/**
 * Returns date adjusted to first day of the month. Can be formatted to DATE_FORMAT
 * @param dateRaw
 * @param shouldFormat
 * @returns {*}
 */
const getMonthStart = (dateRaw, shouldFormat = false) => {
    const date = dayjs(dateRaw).date(1)

    return shouldFormat ? date.format(DATE_FORMAT) : date
}

/**
 * Returns dates for first day of current and next months
 * @returns {{thisMonthStart, nextMonthStart}}
 */
const getStartDates = (dateRaw) => {
    const date = getMonthStart(dateRaw)

    return {
        thisMonthStart: date.format(DATE_FORMAT),
        nextMonthStart: date.add('1', 'month').format(DATE_FORMAT),
    }
}

module.exports = {
    getUniqueByField,
    getConnectionsMapping,
    getMonthStart,
    getStartDates,
}