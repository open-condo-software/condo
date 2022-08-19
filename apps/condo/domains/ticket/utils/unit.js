const { get } = require('lodash')

function getSectionAndFloorByUnitName (property, unitName, unitType) {
    const res = {
        sectionName: null,
        sectionType: null,
        floorName: null,
    }
    if (unitName && unitType) {
        const sections = get(property, ['map', `${unitType !== 'parking' ? 'sections' : 'parking'}`], [])
        for (const section of sections) {
            for (const floor of section.floors) {
                for (const unit of floor.units) {
                    if (unit.label === unitName) {
                        res.sectionName = section.name
                        res.sectionType = section.type
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