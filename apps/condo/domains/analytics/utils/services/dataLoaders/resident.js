const { get, isEmpty } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')

class ResidentGqlKnexLoader extends GqlToKnexBaseAdapter {
    aggregateBy = []

    constructor (where, groupBy) {
        super('Resident', where, groupBy)
        this.aggregateBy = [...this.groups]
    }

    async loadData () {
        const { keystone } = await getSchemaCtx(this.domainName)
        const knex = keystone.adapter.knex

        this.whereIn = {}

        this.where.filter(this.isWhereInCondition).reduce((filter, currentFilter) => {
            const [groupName, groupCondition] = Object.entries(currentFilter)[0]
            const groupIdArray = get(groupCondition, 'id_in')
            const [filterEntities, filterValues] = filter

            if (!this.aggregateBy.includes(groupName)) {
                this.aggregateBy.push(groupName)
            }

            this.whereIn[groupName] = groupIdArray.map(id => [id])
            filterEntities.push(groupName)
            filterValues.push(...groupIdArray.map(id => [id]))
        }, [[], []])

        const query = knex(this.domainName).count('id').select(this.groups).groupBy(this.aggregateBy).where(this.knexWhere)

        if (!isEmpty(this.whereIn)) {
            query.whereIn(Object.keys(this.whereIn), Object.values(this.whereIn)[0])
        }

        this.result = await query.orderBy('count', 'desc')
    }
}

class ResidentDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy }) {
        const residentGqlKnexLoader = new ResidentGqlKnexLoader(where, groupBy)
        await residentGqlKnexLoader.loadData()
        const residents = residentGqlKnexLoader.getResult()

        return { residents }
    }
}

module.exports = { ResidentDataLoader }
