const { get } = require('lodash')

function getSectionAndFloorByUnitName (property, unitName) {
    const res = {
        sectionName: null,
        floorName: null,
    }
    if (unitName) {
        const sections = get(property, ['map', 'sections'], [])
        for (const section of sections) {
            for (const floor of section.floors) {
                for (const unit of floor.units) {
                    if (unit.label === unitName) {
                        res.sectionName = section.name
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