const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')
const { getSchemaCtx } = require('@core/keystone/schema')
const get = require('lodash/get')
const { TICKET_REPORT_DAY_GROUP_STEPS } = require('@condo/domains/ticket/constants/common')
const groupBy = require('lodash/groupBy')
const dayjs = require('dayjs')
const isoWeek = require('dayjs/plugin/isoWeek')
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
        const knex = keystone.adapter.knex

        const where = this.where.filter(condition => !this.isWhereInCondition(condition)).map(condition => {
            return Object.fromEntries(
                Object.entries(condition).map(([field, query]) => (
                    get(query, 'id') ? [field, query.id] : [field, query]
                ))
            )
        })
        const whereInObject = {}
        // TODO(sitozzz): add support for n groups of id_in filter
        // create whereIn structure [['property_id', 'user_id'], [['some_property_id', 'some_user_id'], ...]]
        this.where.filter(this.isWhereInCondition).reduce((filter, currentFilter) => {
            const [groupName, groupCondition] = Object.entries(currentFilter)[0]
            const groupIdArray = get(groupCondition, 'id_in')
            const [filterEntities, filterValues] = filter
            if (!this.aggregateBy.includes(groupName)) {
                this.aggregateBy.push(groupName)
            }
            whereInObject[groupName] = groupIdArray.map(id => [id])
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

        switch (Object.keys(whereInObject).length) {
            case 2:
                this.result = await query.groupBy(this.aggregateBy)
                    .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
                    .whereIn([Object.keys(whereInObject)[0]], Object.values(whereInObject)[0])
                    .whereIn([Object.keys(whereInObject)[1]], Object.values(whereInObject)[1])
                    .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
                break
            case 1:
                this.result = await query.groupBy(this.aggregateBy)
                    .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
                    .whereIn(Object.keys(whereInObject), Object.values(whereInObject)[0])
                    .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
                break
            default:
                this.result = await query.groupBy(this.aggregateBy)
                    .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
                    .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
        }

        // if (whereIn[0].length && whereIn[1].length) {
        //     this.result = await query.groupBy(this.aggregateBy)
        //         .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
        //         .whereIn(whereIn[0], whereIn[1])
        //         .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
        // } else {
        //     this.result = await query.groupBy(this.aggregateBy)
        //         .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
        //         .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
        // }
    }
}

const aggregateData = (data, groupByDependencyList) => {
    let groupByFilter = [...groupByDependencyList]
    switch (groupByDependencyList[0]) {
        case 'property':
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

    for (let i = 0; i < option.length; i++) {
        current[optionKey] = option[i]
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
    let currentDate = dayjs(startDate).startOf(step).isoWeekday(1)
    const lastDate = dayjs(endDate).startOf(step).isoWeekday(1)
    const dateStringFormat = DATE_FORMATS[step]
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
