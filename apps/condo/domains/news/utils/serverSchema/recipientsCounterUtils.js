const get = require('lodash/get')

const { allItemsQueryByChunks } = require('@open-condo/keystone/schema')

const { LOAD_RESIDENTS_CHUNK_SIZE } = require('@condo/domains/news/constants/common')

const getUnitsFromProperty = (property) => (
    [
        ...(get(property, ['map', 'sections'], []) || []),
        ...(get(property, ['map', 'parking'], []) || []),
    ].reduce((acc, section) => ([
        ...acc,
        ...getUnitsFromSection(section),
    ]), []) || []
)

const getUnitsFromSection = (section) => section.floors.flatMap(floor => floor.units.map(unit => ({
    unitName: unit.label,
    unitType: unit.unitType,
})))

/**
 * @param {Property} property
 * @returns {{property: PropertyWhereUniqueInput, unitType: string, unitName: string}[]}
 */
const queryConditionsByUnits = (property) => {
    const conditions = []
    const unitsFromProperty = getUnitsFromProperty(property)
    for (const unitFromProperty of unitsFromProperty) {
        conditions.push({
            AND: [{
                property: { id: property.id },
                unitType: unitFromProperty.unitType,
                unitName: unitFromProperty.unitName,
            }],
        })
    }
    return conditions
}

async function countUniqueUnitsFromResidents (where) {
    const units = new Set()

    // Trying to minimize memory usage by working with chunks without keeping all residents within memory
    await allItemsQueryByChunks({
        schemaName: 'Resident',
        chunkSize: LOAD_RESIDENTS_CHUNK_SIZE,
        where: { ...where, deletedAt: null },
        /**
         * @param {Resident[]} chunk
         * @returns {Resident[]}
         */
        chunkProcessor: (chunk) => {
            chunk.forEach((r) => units.add(`${r.property}_${r.unitType}_${r.unitName}`))

            return []
        },
    })

    return units.size
}

module.exports = { getUnitsFromProperty, getUnitsFromSection, countUniqueUnitsFromResidents, queryConditionsByUnits }
