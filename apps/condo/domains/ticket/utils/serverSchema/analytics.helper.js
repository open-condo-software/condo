const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')
const { getSchemaCtx } = require('@core/keystone/schema')
const get = require('lodash/get')
const { TICKET_REPORT_DAY_GROUP_STEPS } = require('@condo/domains/ticket/constants/common')
const groupBy = require('lodash/groupBy')
const sum = require('lodash/sum')

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
        const knex = keystone.adapter.knex

        const where = this.where.filter(condition => !this.isWhereInCondition(condition)).map(condition => {
            return Object.fromEntries(
                Object.entries(condition).map(([field, query]) => (
                    get(query, 'id') ? [field, query.id] : [field, query]
                ))
            )
        })

        // TODO(sitozzz): add support for n groups of id_in filter
        // create whereIn structure [['property_id', 'user_id'], [['some_property_id', 'some_user_id'], ...]]
        const whereIn = this.where.filter(this.isWhereInCondition).reduce((filter, currentFilter) => {
            const [groupName, groupCondition] = Object.entries(currentFilter)[0]
            const groupIdArray = get(groupCondition, 'id_in')
            const [filterEntities, filterValues] = filter
            filterEntities.push(groupName)
            filterValues.push(...groupIdArray.map(id => [id]))
            return filter
        }, [[], []])


        const query = knex(this.domainName)
            .count('id')
            .select(this.groups)
        if (this.aggregateBy.includes('dayGroup')) {
            query.select(knex.raw(`date_trunc('${this.dayGroup}',  "createdAt") as "dayGroup"`))
        }
        if (whereIn[0].length && whereIn[1].length) {
            this.result = await query.groupBy(this.aggregateBy)
                .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
                .whereIn(whereIn[0], whereIn[1])
                .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
        } else {
            this.result = await query.groupBy(this.aggregateBy)
                .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
                .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
        }
    }
}

const aggregateData = (data, groupByFilter) => {
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

const ticketAnalyticsExcelExportDataMapper = (data, where = {}, groupBy = [], translates = {}) => {
    const result = []
    let rowColumns = []
    const groupByToken = groupBy.join('-')
    let address = get(translates, 'property')

    switch (groupByToken) {
        case 'status-day':
        case 'status-week':
            rowColumns = [...new Set(Object.values(data).flatMap(e => Object.keys(e)))]
            break
        case 'status-property':
            rowColumns = address.includes('@') ? address.split('@') : []
            break
        default:
            throw new Error('unsupported filter')
    }
    if (rowColumns.length === 0) {
        const restTableColumns = {}
        address = address.replaceAll('@', '')
        Object.entries(data).forEach(([ticketType, dataObject]) => {
            const counts = Object.values(dataObject)
            restTableColumns[ticketType] = sum(counts)
        })
        result.push({
            address,
            ...restTableColumns,
        })
    } else {
        switch (groupBy[1]) {
            case 'property':
                rowColumns.forEach((rowAddress) => {
                    const tableRow = { address: rowAddress }
                    Object.entries(data).forEach(([ticketType, dataObject]) => {
                        const counts = Object.entries(dataObject)
                            .filter(obj => obj[0] === rowAddress).map(value => value[1])
                        tableRow[ticketType] = sum(counts)
                    })
                    result.push(tableRow)
                })
                break
            case 'day':
            case 'week':
                rowColumns.forEach((date) => {
                    address = address.replaceAll('@', '')
                    const restTableColumns = {}
                    Object.keys(data).forEach(ticketType => {
                        restTableColumns[ticketType] = data[ticketType][date]
                    })
                    result.push({ address, date, ...restTableColumns })
                })
                break
            default:
                throw new Error('unsupported filter')
        }
    }
    return result
}

module.exports = {
    DATE_FORMATS,
    TicketGqlToKnexAdapter,
    sortStatusesByType,
    aggregateData,
    ticketAnalyticsExcelExportDataMapper,
}
