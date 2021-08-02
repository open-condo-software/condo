const { MAX_TICKET_REPORT_COUNT } = require('@condo/domains/ticket/constants/common')
const { TicketStatus: TicketStatusServerUtils } = require('@condo/domains/ticket/utils/serverSchema')
const { Property: PropertyServerUtils } = require('@condo/domains/property/utils/serverSchema')
const { AnaliticsTicket: AnaliticsTicketServerUtils } = require('@condo/domains/ticket/utils/serverSchema')

const CHUNK_SIZE = 100
const moment = require('moment')

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
    const statuses = await TicketStatusServerUtils.getAll(context, {
        OR: [{ organization: organizationWhereInput }, { organization_is_null: true }],
    })
    // We use organization specific statuses if they exists
    // or default if there is no organization specific status with a same type
    const allStatuses = statuses.filter((status) => {
        if (!status.organization) {
            return true
        }
        return !statuses.find(
            (organizationStatus) => organizationStatus.organization !== null && organizationStatus.type === status.type,
        )
    })
    return sortStatusesByType(allStatuses).map((status) => ({ label: status.name, value: status.type }))
}

const createPropertyRange = async (context, organizationWhereInput) => {
    const properties = await PropertyServerUtils.getAll(context, { organization: organizationWhereInput })
    return properties.map((property) => ({ label: property.address, value: property.id }))
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
        translates[groupName] = Object.fromEntries(range.map(({ value, label }) => [value, label]))
        ranges.push(range)
    }
    // Transform [[a1, a2, a3], [b1, b2], [c1, c2]] to
    // { a1: { b1: { c1: 0, c2: 0 }, b2: { c1: 0, c2: 0 } }, a2: { ... }}
    const groupedCounters = ranges.reduceRight(
        (previousValue, currentValue) => Object.fromEntries(currentValue.map((option) => [option.value, previousValue])),
        0,
    )
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

module.exports = {
    DATE_FORMATS,
    createCountersStructure,
    fetchTicketsForAnalytics,
}
