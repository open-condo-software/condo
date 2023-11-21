const { get } = require('lodash')

const { SECTION_SECTION_TYPE, PARKING_SECTION_TYPE, PARKING_UNIT_TYPE } = require('@condo/domains/property/constants/common')


const SECTIONS_TYPE = 'sections'

function getSectionAndFloorByUnitName (property, unitName, unitType) {
    const res = {
        sectionName: null,
        sectionType: null,
        floorName: null,
    }
    if (unitName && unitType) {
        const sections = get(property, ['map', `${unitType !== PARKING_UNIT_TYPE ? SECTIONS_TYPE : PARKING_UNIT_TYPE}`], [])
        for (const section of sections) {
            for (const floor of section.floors) {
                for (const unit of floor.units) {
                    if (unit.label === unitName) {
                        res.sectionName = section.name
                        res.sectionType = unitType !== PARKING_UNIT_TYPE ? SECTION_SECTION_TYPE : PARKING_SECTION_TYPE
                        res.floorName = floor.name
                        break
                    }
                }
            }
        }
    }

    return res
}

module.exports = {
    getSectionAndFloorByUnitName,
}