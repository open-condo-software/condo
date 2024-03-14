const { get } = require('lodash')

const { FLAT_UNIT_TYPE, SECTION_SECTION_TYPE } = require('@condo/domains/property/constants/common')


const getUnitTypeFieldResolveInput = ({ unitTypeFieldName = 'unitType', unitNameFieldName = 'unitName' } = {}) => ({ resolvedData, existingItem }) => {
    const newItem = { ...existingItem, ...resolvedData }
    const unitType = get(newItem, unitTypeFieldName)
    const unitName = get(newItem, unitNameFieldName)
    const existedUnitType = get(existingItem, unitTypeFieldName)

    if (!unitName && unitType) {
        return null
    } else if (!unitType && unitName) {
        return existedUnitType || FLAT_UNIT_TYPE
    } else {
        return unitType
    }
}

const getSectionTypeFieldResolveInput = ({ sectionTypeFieldName = 'sectionType', sectionNameFieldName = 'sectionName' } = {}) => ({ resolvedData, existingItem }) => {
    const newItem = { ...existingItem, ...resolvedData }
    const sectionType = get(newItem, sectionTypeFieldName)
    const sectionName = get(newItem, sectionNameFieldName)
    const existedSectionType = get(existingItem, sectionTypeFieldName)

    if (!sectionName && sectionType) {
        return null
    } else if (!sectionType && sectionName) {
        return existedSectionType || SECTION_SECTION_TYPE
    } else {
        return sectionType
    }
}

module.exports = {
    getUnitTypeFieldResolveInput,
    getSectionTypeFieldResolveInput,
}
