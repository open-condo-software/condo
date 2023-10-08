const { get, omit, find } = require('lodash')

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
        const knex = keystone.adapter.knex


        const propertyFilter = get(find(this.where, 'property', {}), 'property.id_in', [])
        const incidentFilter = get(find(this.where, 'incident', {}), 'incident.id_in', [])

        this.result = await knex(this.domainName)
            .select(knex.raw('COUNT(DISTINCT incident)'))
            .whereIn('property', propertyFilter)
            .whereIn('incident', incidentFilter)
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
