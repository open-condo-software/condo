const dayjs = require('dayjs')
const isoWeek = require('dayjs/plugin/isoWeek')
const get = require('lodash/get')
const groupBy = require('lodash/groupBy')

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
        const knex = keystone.adapter.knex

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
