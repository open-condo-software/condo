const get = require('lodash/get')

const { getDatabaseAdapter, isPrismaAdapter, castUuidParams, convertPrismaBigInts } = require('@open-condo/keystone/databaseAdapters/utils')
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
    const adapter = getDatabaseAdapter(keystone)

    if (isPrismaAdapter(keystone)) {
        const ph = propertyIds.map((_, i) => `$${i + 2}`).join(', ')
        const sql = `SELECT count(distinct(concat("property", "unitName", "unitType"))) FROM "Resident" WHERE "organization" = $1 AND "property" IN (${ph}) AND "deletedAt" IS NULL`
        const allParams = [organizationId, ...propertyIds]
        const result = convertPrismaBigInts(await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, allParams), ...allParams))
        return get(result, [0, 'count'], null)
    }

    const { knex } = adapter
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
    const adapter = getDatabaseAdapter(keystone)

    if (isPrismaAdapter(keystone)) {
        const params = [organizationId, propertyId]
        let paramIdx = 3

        // Build OR conditions: (unitType=X AND unitName IN (...)) OR ...
        const orParts = Object.keys(unitNamesByUnitType).map(unitType => {
            const unitNames = unitNamesByUnitType[unitType]
            params.push(unitType)
            const typeParam = `$${paramIdx++}`
            const namePh = unitNames.map(name => { params.push(name); return `$${paramIdx++}` }).join(', ')
            return `("unitType" = ${typeParam} AND "unitName" IN (${namePh}))`
        })

        const orClause = orParts.length > 0 ? `AND (${orParts.join(' OR ')})` : ''
        const sql = `SELECT count(distinct(concat("property", "unitName", "unitType"))) FROM "Resident" WHERE "organization" = $1 AND "property" = $2 AND "deletedAt" IS NULL ${orClause}`
        const result = convertPrismaBigInts(await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, params), ...params))
        return get(result, [0, 'count'], null)
    }

    const { knex } = adapter
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
