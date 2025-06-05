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
 * Lets you count unique units from residents by property for simple news item scopes (ones that have property and organization)
 * @param { string } organizationId
 * @param { string[] } propertyIds
 * @return { Promise<number> }
 */
async function countUniqueUnitsFromResidentsByPropertyIds (organizationId, propertyIds) {
    const { keystone } = getSchemaCtx('Resident')
    const { knex } = getDatabaseAdapter(keystone)

    const result = await knex('Resident')
        .select(knex.raw('count(distinct(concat("property", "unitName", "unitType")))'))
        .where('organization', organizationId)
        .whereIn('property', propertyIds)
        .where('deletedAt', null)

    return get(result, [0, 'count'], null)
}


/**
 * Lets you count unique units from residents by property for detailed news item scopes (ones that have property, organization, unitName and/or unitType)
 * @param { string } propertyId
 * @param { string } organizationId
 * @param { { unitType: unitNames[] } } unitNamesByUnitType
 * @return { Promise<number> }
 */
async function countUniqueUnitsFromResidentsByProperty (organizationId, propertyId, unitNamesByUnitType) {
    const { keystone } = getSchemaCtx('Resident')
    const { knex } = getDatabaseAdapter(keystone)

    const result = await knex('Resident')
        .select(knex.raw('count(distinct(concat("property", "unitName", "unitType")))'))
        .where('organization', organizationId)
        .where('property', propertyId)
        .where('deletedAt', null)
        .where(function () {
            /**
             * This will generate sql like:
             *
             * OR unitType=flat AND unitName_in [...]
             * OR unitType=apartment AND unitName_in [...]
             */
            Object.keys(unitNamesByUnitType).forEach(unitType => {
                const unitNames = unitNamesByUnitType[unitType]
                this.orWhere(function () {
                    this.where('unitType', unitType).whereIn('unitName', unitNames)
                })
            })
        })

    return get(result, [0, 'count'], null)
}

module.exports = { getUnitsFromProperty, getUnitsFromSection, countUniqueUnitsFromResidentsByPropertyIds, countUniqueUnitsFromResidentsByProperty }
