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

const getAddressDetails = (propertyAddressMeta) => {
    const addressMeta = get(propertyAddressMeta, 'data')

    const streetWithType = get(addressMeta, 'street_with_type')

    const houseType = get(addressMeta, 'house_type')
    const houseName = get(addressMeta, 'house')

    const blockType = get(addressMeta, 'block_type')
    const blockName = get(addressMeta, 'block')

    const regionType = get(addressMeta, 'region_type')
    const regionName = get(addressMeta, 'region')
    const regionWithType = get(addressMeta, 'region_with_type')
    const regionNamePosition = regionWithType && regionWithType.split(' ')[0] === regionName ? 0 : 1
    const regionWithFullType = regionNamePosition === 0 ? `${regionName} ${regionType}` : `${regionType} ${regionName}`

    const cityWithType = get(addressMeta, 'city_with_type')
    const cityType = get(addressMeta, 'city_type')
    const cityName = get(addressMeta, 'city')

    const settlementPart = get(addressMeta, 'settlement_with_type')

    const block = blockType ? ` ${blockType} ${blockName}` : ''
    const settlement = streetWithType ? streetWithType : settlementPart
    const housePart = `${houseType} ${houseName}${block}`
    const streetPart = settlement && `${settlement}, ${housePart}`
    const regionPart = regionName && regionName !== cityName && regionWithFullType
    const cityPart = cityWithType ? cityWithType : null

    const areaWithType = get(addressMeta, 'area_with_type')
    const areaPart = areaWithType && areaWithType !== cityPart && areaWithType

    const regionLine = regionPart ? `${regionPart}` : ''
    const areaLine = areaPart ? `${regionLine ? ',' : ''} ${areaPart}` : ''
    const cityLine = cityPart ? `${regionLine ? ',' : ''} ${cityPart}` : ''
    const settlementLine = settlementPart ? `, ${settlementPart}` : ''
    const renderData = regionLine + areaLine + settlementLine + cityLine

    return { streetPart, areaPart, settlementPart, regionPart, cityPart, renderData, settlement, housePart, cityType, cityName, houseName, block }
}

/**
 * Returns a flat array of units
 * @param sections – sections from property map
 * @return {FlatArray<*[], 2>[]}
 */
const getUnitsFromSections = (sections = []) => {
    if (!Array.isArray(sections)) {
        return []
    }

    return sections.map(section =>
        (Array.isArray(section.floors) ? section.floors : []).map(floor => Array.isArray(floor.units) ? floor.units : [])
    ).flat(2)
}

module.exports = {
    FLAT_WITHOUT_FLAT_TYPE_MESSAGE,
    getAddressUpToBuildingFrom,
    normalizePropertyMap,
    getAddressDetails,
    getUnitsFromSections,
}
