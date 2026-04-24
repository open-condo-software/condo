const { get, isEmpty } = require('lodash')

const { getDatabaseAdapter, isPrismaAdapter, castUuidParams, convertPrismaBigInts } = require('@open-condo/keystone/databaseAdapters/utils')
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
        const adapter = getDatabaseAdapter(keystone)

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

        if (isPrismaAdapter(keystone)) {
            const selectCols = this.groups.map(g => `"${g}"`).join(', ')
            const groupByCols = this.aggregateBy.map(g => `"${g}"`).join(', ')

            const whereParts = []
            const params = []
            let paramIdx = 1

            // Static where conditions
            for (const [key, val] of Object.entries(this.knexWhere)) {
                if (val === null) {
                    whereParts.push(`"${key}" IS NULL`)
                } else {
                    whereParts.push(`"${key}" = $${paramIdx++}`)
                    params.push(val)
                }
            }

            // WhereIn conditions
            if (!isEmpty(this.whereIn)) {
                for (const [col, values] of Object.entries(this.whereIn)) {
                    if (values.length === 0) { this.result = []; return }
                    const ph = values.map(v => { params.push(v[0]); return `$${paramIdx++}` }).join(', ')
                    whereParts.push(`"${col}" IN (${ph})`)
                }
            }

            const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''
            const sql = `SELECT COUNT("id") as "count", ${selectCols} FROM "${this.domainName}" ${whereClause} GROUP BY ${groupByCols} ORDER BY "count" DESC`
            this.result = convertPrismaBigInts(await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, params), ...params))
        } else {
            const { knex } = adapter
            const query = knex(this.domainName).count('id').select(this.groups).groupBy(this.aggregateBy).where(this.knexWhere)

            if (!isEmpty(this.whereIn)) {
                query.whereIn(Object.keys(this.whereIn), Object.values(this.whereIn)[0])
            }

            this.result = await query.orderBy('count', 'desc')
        }
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
