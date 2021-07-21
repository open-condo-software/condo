const { TicketStatus: TicketStatusServerUtils } = require('@condo/domains/ticket/utils/serverSchema')
const { Property: PropertyServerUtils } = require('@condo/domains/property/utils/serverSchema')
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
    let maxLength = 100
    while (current < stop && --maxLength > 0) {
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

const createStatusRange = async (context, organization) => {
    const statuses = await TicketStatusServerUtils.getAll(context, { OR: [
        { organization: { id: organization } },
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

const createPropertyRange = async (context, organization) => {
    const properties = await PropertyServerUtils.getAll(context, { organization: { id: organization } })
    return properties.map( property => ({ label: property.address, value: property.id }))
}

const createCountersStructure = async ({ context, organization, groups, datesRange }) => {
    const grouppedCounters = {}
    const translates = {}
    const { min, max } = datesRange
    const ranges = []
    for (const groupName of groups) {
        let range = []
        switch (groupName) {
            case 'day':
            case 'week':
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
    // TODO(zuch): n levels of group (now only 2) Maybe, we never meet 3+ lvls
    ranges[0].forEach(option => {
        grouppedCounters[option.value] = {  }
        ranges[1].forEach(subOption => {
            grouppedCounters[option.value][subOption.value] = 0
        })
    })
    return {
        grouppedCounters,
        translates,
    }
}

module.exports = {
    DATE_FORMATS,
    createCountersStructure,
}
