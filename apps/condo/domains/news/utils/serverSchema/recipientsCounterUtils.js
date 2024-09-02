const get = require('lodash/get')

const { getDatabaseAdapter } = require('@open-condo/keystone/databaseAdapters/utils')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

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

async function countUniqueUnitsFromResidents (unitNamesByProperty) {
    const { keystone } = getSchemaCtx('Resident')
    const { knex } = getDatabaseAdapter(keystone)

    const result = await knex('Resident')
        .select(knex.raw('count(distinct(concat("unitName", "property")))'))
        .where(function () {
            Object.keys(unitNamesByProperty).forEach(propertyId => {
                const unitNames = unitNamesByProperty[propertyId]
                this.orWhere(function () {
                    this.where('property', propertyId).whereIn('unitName', unitNames)
                })
            })
        })

    return get(result, [0, 'count'], null)
}

module.exports = { getUnitsFromProperty, getUnitsFromSection, countUniqueUnitsFromResidents, queryConditionsByUnits }
