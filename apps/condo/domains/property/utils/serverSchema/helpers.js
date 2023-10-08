const { get, omitBy, isNull, isArray } = require('lodash')

const FLAT_WITHOUT_FLAT_TYPE_MESSAGE = 'Flat is specified, but flat type is not!'

/**
 * Sometimes address can contain flat with prefix, for example, in case of scanning receipt with QR-code.
 * Input data is out of control ;)
 * @return {String} address without flat
 */
const getAddressUpToBuildingFrom = (addressMeta) => {
    const data = get(addressMeta, 'data')
    const value = get(addressMeta, 'rawValue', get(addressMeta, 'value'))

    const flat = get(data, 'flat')
    let result = value
    if (flat) {
        const flatType = get(data, 'flat_type')
        if (!flatType) throw new Error(FLAT_WITHOUT_FLAT_TYPE_MESSAGE)
        const suffix = `, ${flatType} ${flat}`
        result = value.substring(0, value.length - suffix.length)
    }
    return result
}

/**
 * Removes `name` field with `null` value from `map.sections[].floors[].units[]`
 * @param {BuildingMap} map
 * @return {BuildingMap}
 */
const normalizePropertyMap = ({ sections, parking, ...restMapProps }) => ({
    ...restMapProps,
    parking: isArray(parking) ? parking.map(({ floors, ...restSectionProps }) => ({
        ...restSectionProps,
        floors: floors.map(({ units, ...restFloorProps }) => ({
            ...restFloorProps,
            units: units.map(unit => omitBy(unit, isNull)),
        })),
    })) : [],
    sections: sections.map(({ floors, ...restSectionProps }) => ({
        ...restSectionProps,
        floors: floors.map(({ units, ...restFloorProps }) => ({
            ...restFloorProps,
            units: units.map(unit => omitBy(unit, isNull)),
        })),
    })),
})

module.exports = {
    FLAT_WITHOUT_FLAT_TYPE_MESSAGE,
    getAddressUpToBuildingFrom,
    normalizePropertyMap,
}
