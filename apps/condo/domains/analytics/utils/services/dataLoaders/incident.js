const { get, omit, find } = require('lodash')

const { getDatabaseAdapter, isPrismaAdapter, castUuidParams, convertPrismaBigInts } = require('@open-condo/keystone/databaseAdapters/utils')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')
const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')
const { INCIDENT_STATUS_ACTUAL } = require('@condo/domains/ticket/constants/incident')

class IncidentPropertyGqlKnexLoader extends GqlToKnexBaseAdapter {
    constructor (where, groupBy) {
        super('IncidentProperty', where, groupBy)
    }

    async loadData () {
        const { keystone } = await getSchemaCtx(this.domainName)
        const adapter = getDatabaseAdapter(keystone)

        const propertyFilter = get(find(this.where, 'property', {}), 'property.id_in', [])
        const incidentFilter = get(find(this.where, 'incident', {}), 'incident.id_in', [])

        if (isPrismaAdapter(keystone)) {
            const propPh = propertyFilter.map((_, i) => `$${i + 1}`).join(', ')
            const incPh = incidentFilter.map((_, i) => `$${i + 1 + propertyFilter.length}`).join(', ')
            const sql = `SELECT COUNT(DISTINCT "incident") FROM "${this.domainName}" WHERE "property" IN (${propPh}) AND "incident" IN (${incPh})`
            const allParams = [...propertyFilter, ...incidentFilter]
            this.result = convertPrismaBigInts(await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, allParams), ...allParams))
        } else {
            const { knex } = adapter
            this.result = await knex(this.domainName)
                .select(knex.raw('COUNT(DISTINCT incident)'))
                .whereIn('property', propertyFilter)
                .whereIn('incident', incidentFilter)
        }
    }
}


class IncidentDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy }) {
        const propertyIds = get(where, 'property.id_in')

        const incidentLoader = new GqlWithKnexLoadList({
            listKey: 'Incident',
            fields: 'id',
            where: {
                ...omit(where, 'property'),
                status: INCIDENT_STATUS_ACTUAL,
            },
        })

        const incidentIds = await incidentLoader.load()

        if (!propertyIds || incidentIds.length === 0) {
            return { count: incidentIds.length }
        }

        const incidentPropertyLoader = new IncidentPropertyGqlKnexLoader({
            incident: { id_in: incidentIds.map(({ id }) => id) },
            property: { id_in: propertyIds },
        }, ['incident', 'property'])

        await incidentPropertyLoader.loadData()
        const result = incidentPropertyLoader.getResult()

        return { count: get(result, '0.count', '0') }
    }
}

module.exports = { IncidentDataLoader }
