const dayjs = require('dayjs')
const isoWeek = require('dayjs/plugin/isoWeek')
const get = require('lodash/get')
const groupBy = require('lodash/groupBy')

const { getDatabaseAdapter, isPrismaAdapter, castUuidParams, convertPrismaBigInts } = require('@open-condo/keystone/databaseAdapters/utils')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')
const { TICKET_REPORT_DAY_GROUP_STEPS } = require('@condo/domains/ticket/constants/common')

dayjs.extend(isoWeek)

const DATE_FORMATS = {
    day: 'DD.MM.YYYY',
    week: 'DD.MM.YYYY',
    month: 'MM.YYYY',
}

const sortStatusesByType = (statuses) => {
    // status priority map [min -> max]
    const orderedStatusPriority = ['closed', 'deferred', 'canceled', 'completed', 'processing', 'new_or_reopened']
    return statuses.sort((leftStatus, rightStatus) => {
        const leftStatusWeight = orderedStatusPriority.indexOf(leftStatus.type)
        const rightStatusWeight = orderedStatusPriority.indexOf(rightStatus.type)

        if (leftStatusWeight < rightStatusWeight) {
            return 1
        } else if (leftStatusWeight > rightStatusWeight) {
            return -1
        }
        return 0
    })
}

class TicketGqlToKnexAdapter extends GqlToKnexBaseAdapter {
    aggregateBy = []
    constructor (where, groupBy) {
        super('Ticket', where, groupBy)
        this.aggregateBy = groupBy
            .some(e => TICKET_REPORT_DAY_GROUP_STEPS.includes(e)) ? ['dayGroup', ...this.groups] : [...this.groups]
    }

    /**
     * Execute query based for domainName table with where & groupBy expressions
     * @returns {Promise<void>}
     */
    async loadData () {
        this.result = null
        const { keystone } = await getSchemaCtx(this.domainName)
        const adapter = getDatabaseAdapter(keystone)

        this.whereIn = Object.fromEntries(this.whereIn)
        // create whereIn structure [['property_id', 'user_id'], [['some_property_id', 'some_user_id'], ...]]
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
            return filter
        }, [[], []])

        if (isPrismaAdapter(keystone)) {
            await this._loadDataPrisma(adapter)
        } else {
            await this._loadDataKnex(adapter)
        }
    }

    /** @private */
    async _loadDataPrisma (adapter) {
        const selectParts = ['COUNT("id") as "count"', ...this.groups.map(g => `"${g}"`)]
        if (this.aggregateBy.includes('dayGroup')) {
            selectParts.push(`to_char(date_trunc('${this.dayGroup}', "createdAt"), 'DD.MM.YYYY') as "dayGroup"`)
        }
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
        for (const [col, values] of Object.entries(this.whereIn)) {
            if (values.length === 0) { this.result = []; return }
            const ph = values.map(v => { params.push(v[0]); return `$${paramIdx++}` }).join(', ')
            whereParts.push(`"${col}" IN (${ph})`)
        }

        // Date range
        if (this.dateRange.from && this.dateRange.to) {
            whereParts.push(`"createdAt" BETWEEN $${paramIdx++} AND $${paramIdx++}`)
            params.push(this.dateRange.from, this.dateRange.to)
        }

        const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''
        const sql = `SELECT ${selectParts.join(', ')} FROM "${this.domainName}" ${whereClause} GROUP BY ${groupByCols}`
        this.result = convertPrismaBigInts(await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, params), ...params))
    }

    /** @private */
    async _loadDataKnex (adapter) {
        const { knex } = adapter
        const query = knex(this.domainName)
            .count('id')
            .select(this.groups)
        if (this.aggregateBy.includes('dayGroup')) {
            query.select(knex.raw(`to_char(date_trunc('${this.dayGroup}',  "createdAt"), 'DD.MM.YYYY') as "dayGroup"`))
        }

        switch (Object.keys(this.whereIn).length) {
            case 2:
                this.result = await query.groupBy(this.aggregateBy)
                    .where(this.knexWhere)
                    .whereIn([Object.keys(this.whereIn)[0]], Object.values(this.whereIn)[0])
                    .whereIn([Object.keys(this.whereIn)[1]], Object.values(this.whereIn)[1])
                    .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
                break
            case 1:
                this.result = await query.groupBy(this.aggregateBy)
                    .where(this.knexWhere)
                    .whereIn(Object.keys(this.whereIn), Object.values(this.whereIn)[0])
                    .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
                break
            default:
                this.result = await query.groupBy(this.aggregateBy)
                    .where(this.knexWhere)
                    .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
        }
    }
}

const aggregateData = (data, groupByDependencyList) => {
    let groupByFilter = [...groupByDependencyList]
    switch (groupByDependencyList[0]) {
        case 'property':
        case 'categoryClassifier':
        case 'executor':
        case 'assignee':
            groupByFilter = groupByFilter.reverse()
            break
        default:
            break
    }
    const [axisGroupKey] = groupByFilter
    const labelsGroupKey = TICKET_REPORT_DAY_GROUP_STEPS.includes(groupByFilter[1]) ? 'dayGroup' : groupByFilter[1]
    const groupedResult = groupBy(data, axisGroupKey)
    const result = {}
    Object.entries(groupedResult).forEach(([filter, dataObject]) => {
        result[filter] = Object.fromEntries(
            Object.entries(
                groupBy(dataObject, labelsGroupKey)
            ).map(([labelsGroupTitle, resultObject]) => [labelsGroupTitle, resultObject[0].count])
        )
    })
    return { result, groupKeys: [axisGroupKey, labelsGroupKey] }
}

const getCombinations = ({ options = {}, optionIndex = 0, results = [], current = {} }) => {
    const allKeys = Object.keys(options)
    const optionKey = allKeys[optionIndex]
    const option = options[optionKey]

    for (const element of option) {
        current[optionKey] = element
        if (optionIndex + 1 < allKeys.length) {
            getCombinations({ options, optionIndex: optionIndex + 1, results, current })
        } else {
            try {
                const res = JSON.parse(JSON.stringify(current))
                results.push(res)
            } catch (e) {
                break
            }
        }
    }

    return results
}

const enumerateDaysBetweenDates = function (startDate, endDate, step = 'day') {
    const dateStringFormat = DATE_FORMATS[step]
    let currentDate = dayjs(startDate)
    const lastDate = dayjs(endDate).startOf(step)
    const dates = [currentDate.format(dateStringFormat)]

    while (currentDate.add(1, step).diff(lastDate) < 0) {
        currentDate = currentDate.add(1, step)
        dates.push(currentDate.clone().format(dateStringFormat))
    }
    dates.push(lastDate.format(dateStringFormat))
    return dates
}

module.exports = {
    DATE_FORMATS,
    TicketGqlToKnexAdapter,
    sortStatusesByType,
    aggregateData,
    getCombinations,
    enumerateDaysBetweenDates,
}
