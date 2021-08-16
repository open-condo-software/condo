const { MAX_TICKET_REPORT_COUNT } =  require('@condo/domains/ticket/constants/common')
const { TicketStatus: TicketStatusServerUtils } = require('@condo/domains/ticket/utils/serverSchema')
const { Property: PropertyServerUtils } = require('@condo/domains/property/utils/serverSchema')
const { AnaliticsTicket: AnaliticsTicketServerUtils } = require('@condo/domains/ticket/utils/serverSchema')

const CHUNK_SIZE = 100
const moment = require('moment')
const { AnalyticsQueryBuilder } = require('@condo/domains/common/utils/serverSchema/AnalyticsQueryBuilder')
const { getSchemaCtx } = require('@core/keystone/schema')
const has = require('lodash/get')
const get = require('lodash/get')

const DATE_FORMATS = {
    day: 'DD.MM.YYYY',
    week: 'DD.MM.YYYY',
    month: 'MM.YYYY',
}

const createDateRange = (start, end, tick) => {
    let current = moment(start)
    let stop = moment(end)
    let range = []
    let maxLength = 1000
    while (current <= stop && --maxLength > 0) {
        const value = current.format(DATE_FORMATS[tick])
        range.push({ label: value, value: value })
        current = current.add(1, tick)
    }
    return range
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

const createStatusRange = async (context, organizationWhereInput) => {
    const statuses = await TicketStatusServerUtils.getAll(context, { OR: [
        { organization: organizationWhereInput },
        { organization_is_null: true },
    ] })
    // We use organization specific statuses if they exists
    // or default if there is no organization specific status with a same type
    const allStatuses = statuses.filter(status => {
        if (!status.organization) {
            return true
        }
        return !statuses
            .find(organizationStatus => organizationStatus.organization !== null && organizationStatus.type === status.type)
    })
    return sortStatusesByType(allStatuses).map(status => ({ label: status.name, value: status.type }))
}

const createPropertyRange = async (context, organizationWhereInput) => {
    const properties = await PropertyServerUtils.getAll(context, { organization:  organizationWhereInput  })
    return properties.map( property => ({ label: property.address, value: property.id }))
}

// TODO(zuch): add support for groupping by classifier, assignee, executor
const createCountersStructure = async ({ context, organization, groups, datesRange }) => {
    const translates = {}
    const { min, max } = datesRange
    const ranges = []
    for (const groupName of groups) {
        let range = []
        switch (groupName) {
            case 'week':
                range = createDateRange(moment(min).endOf(groupName), moment(max).endOf(groupName), groupName)
                break
            case 'day':
            case 'month':
                range = createDateRange(min, max, groupName)
                break
            case 'status':
                range = await createStatusRange(context, organization)
                break
            case 'property':
                range = await createPropertyRange(context, organization)
                break
            default:
                throw new Error('Unknown group name')
        }
        translates[groupName] = Object.fromEntries(range.map(({ value, label }) => ([ value, label ])))
        ranges.push(range)
    }
    // Transform [[a1, a2, a3], [b1, b2], [c1, c2]] to
    // { a1: { b1: { c1: 0, c2: 0 }, b2: { c1: 0, c2: 0 } }, a2: { ... }}
    const groupedCounters = ranges.reduceRight((previousValue, currentValue) =>
        Object.fromEntries(currentValue.map(option =>
            ([option.value, previousValue])))
    , 0)
    return {
        groupedCounters,
        translates,
    }
}

const fetchTicketsForAnalytics = async (context, ticketWhereInput) => {
    let skip = 0
    let maxCount = MAX_TICKET_REPORT_COUNT
    let newchunk = []
    let allTickets = []
    do {
        newchunk = await AnaliticsTicketServerUtils.getAll(context, ticketWhereInput, { first: CHUNK_SIZE, skip: skip })
        allTickets = allTickets.concat(newchunk)
        skip += newchunk.length
    } while (--maxCount > 0 && newchunk.length)
    return allTickets
}

class TicketAnalyticsQueryBuilder extends AnalyticsQueryBuilder {
    constructor (where, groupBy) {
        super('Ticket', where, groupBy)
    }

    async loadData () {
        this.result = null
        const { keystone } = await getSchemaCtx(this.domainName)
        const knex = keystone.adapter.knex

        const where = this.where.filter(condition => !this.isWhereInCondition(condition)).map(condition => {
            return Object.fromEntries(
                Object.entries(condition).map(([field, query]) => (
                    has(query, 'id') ? [field, query.id] : [field, query]
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
            .select(knex.raw(`date_trunc('${this.dayGroup}',  "createdAt") as "dayGroup"`))
            .select(this.groups)

        if (whereIn[0].length && whereIn[1].length) {
            this.result = await query.groupBy(['dayGroup', ...this.groups])
                .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
                .whereIn(whereIn[0], whereIn[1])
                .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
                .orderBy('dayGroup', 'desc')
        }
        this.result = await query.groupBy(['dayGroup', ...this.groups])
            .where(where.reduce((acc, current) => ({ ...acc, ...current }), {}))
            .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
            .orderBy('dayGroup', 'desc')
    }
}

module.exports = {
    DATE_FORMATS,
    createCountersStructure,
    fetchTicketsForAnalytics,
    TicketAnalyticsQueryBuilder,
    sortStatusesByType,
}
