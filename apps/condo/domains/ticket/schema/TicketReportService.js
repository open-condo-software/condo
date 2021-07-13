const { GQLCustomSchema } = require('@core/keystone/schema')
const { Ticket, TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const moment = require('moment')
const { checkUserBelongsToOrganization } = require('@condo/domains/organization/utils/accessSchema')
const access = require('@condo/domains/ticket/access/TicketReportService')
const { TICKET_STATUS_TYPES: ticketStatusTypes } = require('@condo/domains/ticket/constants')

const PERIOD_TYPES = ['week', 'month', 'quarter']
const TICKET_TYPES = ['default', 'paid', 'emergency']
const CHART_VIEW_MODES = ['bar', 'line', 'pie']
const DATE_FORMAT = 'DD.MM.YYYY'

const countTicketsByStatuses = async (context, dateStart, dateEnd, organizationId) => {
    const answer = {}
    for (const type of ticketStatusTypes) {
        const queryByStatus = [
            { createdAt_lte: dateEnd }, { createdAt_gte: dateStart },
            { status: { type } }, { organization: { id: organizationId } },
        ]
        const count = await Ticket.count(context, { AND: queryByStatus })
        answer[type] = count || 0
    }
    return answer
}

const getOrganizationStatuses = async (context, userOrganizationId) => {
    const hasAccess = await checkUserBelongsToOrganization(context.authedItem.id, userOrganizationId, 'canManageTickets')
    if (!hasAccess) {
        throw new Error('[error] you do not have access to this organization')
    }
    const statuses = await TicketStatus.getAll(context, { OR: [
        { organization: { id: userOrganizationId } },
        { organization_is_null: true },
    ] })

    return statuses.filter(status =>
        !(!status.organization && statuses
            .find(organizationStatus => organizationStatus.organization !== null
                && organizationStatus.type === status.type))
    )
}

const getOrganizationProperties = async (context, userOrganizationId) => {
    return await Property.getAll(context, {
        organization: { id: userOrganizationId },
    })
}

const TicketReportService = new GQLCustomSchema('TicketReportService', {
    types: [
        {
            access: true,
            type: `enum TicketReportPeriodType { ${PERIOD_TYPES.join(' ')} }`,
        },
        {
            access: true,
            type: 'input TicketReportWidgetInput { periodType: TicketReportPeriodType! offset: Int, userOrganizationId: String! }',
        },
        {
            access: true,
            type: 'type TicketReportData { statusName: String! currentValue: Int! growth: Float! statusType: TicketStatusTypeType! }',
        },
        {
            access: true,
            type: 'type TicketReportWidgetOutput { data: [ TicketReportData! ] }',
        },
        {
            access: true,
            type: `enum TicketType { ${TICKET_TYPES.join(' ')} }`,
        },
        {
            access: true,
            type: `enum ChartViewMode { ${CHART_VIEW_MODES.join(' ')} }`,
        },
        {
            access: true,
            type: 'input TicketReportAnalyticsInput { dateFrom: String!, dateTo: String!, groupBy: String!, userOrganizationId: String!, ticketType: TicketType!, viewMode: ChartViewMode!, addressList: [ String! ] }',
        },
        {
            access: true,
            type: 'type TicketReportAnalyticsOutput { data: JSON! }',
        },
    ],
    queries: [
        {
            access: access.canReadTicketReportWidgetData,
            schema: 'ticketReportWidgetData(data: TicketReportWidgetInput!): TicketReportWidgetOutput',
            resolver: async (parent, args, context, info, extra) => {
                const { periodType, offset = 0, userOrganizationId } = args.data
                const statuses = await getOrganizationStatuses(context, userOrganizationId)
                const statusesMap = Object.fromEntries(statuses.map(({ type, name }) => ([type, name])))

                if (!PERIOD_TYPES.includes(periodType)) {
                    throw new Error(`[error] possible period types are: ${PERIOD_TYPES.join(', ')}`)
                }
                const startDate = moment().startOf(periodType).add(offset, periodType).toISOString()
                const previousStartDate = moment().startOf(periodType).add(offset - 1, periodType).toISOString()
                const endDate = moment().endOf(periodType).add(offset, periodType).toISOString()
                const previousEndDate =  moment().endOf(periodType).add(offset - 1, periodType).toISOString()


                const currentData = await countTicketsByStatuses(context,  startDate, endDate, userOrganizationId)
                const previousData = await countTicketsByStatuses(context, previousStartDate, previousEndDate, userOrganizationId)

                const data = []
                Object.entries(currentData).forEach((e) => {
                    const [statusType, currentValue] = e
                    const previousValue = previousData[statusType]
                    let growth = 0
                    if (previousValue !== 0) {
                        growth = Number((currentValue * 100 / previousValue - 100).toFixed(2))
                    }

                    data.push({
                        statusType,
                        statusName: statusesMap[statusType],
                        currentValue,
                        growth,
                    })
                })

                return { data }
            },
        },
        {
            access: true,
            schema: 'ticketReportAnalyticsData(data: TicketReportAnalyticsInput!): TicketReportAnalyticsOutput',
            resolver: async (parent, args, context, info, extra) => {
                const { dateFrom, dateTo, groupBy, userOrganizationId, ticketType, viewMode, addressList } = args.data
                const isLineChart = viewMode === 'line'
                const statuses = await getOrganizationStatuses(context, userOrganizationId)
                const statusesMap = Object.fromEntries(statuses.map(({ type, name }) => ([type, name])))
                const userProperties = await getOrganizationProperties(context, userOrganizationId)
                const userPropertiesMap = Object.fromEntries(userProperties.map(({ id, address }) => ([id, address])))
                const daysCount = moment(dateTo).diff(moment(dateFrom), 'days') + 1
                const daysMap = Array.from({ length: daysCount }, (_, day) => moment(dateFrom).add(day, 'days'))
                const labels = isLineChart ? statusesMap : userPropertiesMap

                const result = {}
                // TODO: collect for addressList, now selecting all
                const listViewDataMapper = (_, index) => {
                    if (isLineChart) {
                        return {
                            date: daysMap[index].format(DATE_FORMAT),
                            address: null,
                        }
                    }
                    if (!isLineChart && addressList.length) {
                        return {
                            address: userPropertiesMap[index],
                        }
                    }
                    // Address filter is empty, return summary info
                    return {
                        address: null,
                    }
                }
                const tableData = Array.from({
                    length: isLineChart ? daysCount : (!addressList.length ? 1 : addressList.length),
                }, listViewDataMapper)

                const stackTicketsField = isLineChart ? ticketStatusTypes : userProperties
                for (const stackField of stackTicketsField) {
                    if (isLineChart) {
                        result[stackField] = {}
                    } else {
                        const { id } = stackField
                        result[id] = {}
                    }
                    const groupTicketsField = isLineChart ? daysMap : ticketStatusTypes
                    for (const groupField of groupTicketsField) {
                        const type = isLineChart ? stackField : groupField
                        let query = [
                            { status: { type } }, { organization: { id: userOrganizationId } },
                            { isPaid: ticketType === 'paid', isEmergency: ticketType === 'emergency' },
                        ]
                        if (isLineChart) {
                            query = query.concat([
                                { createdAt_gte: groupField.startOf('day').toISOString() },
                                { createdAt_lte: groupField.endOf('day').toISOString() },
                            ])
                        } else {
                            const { id } = stackField
                            query = query.concat([
                                { property: { id } }, { createdAt_gte: dateFrom }, { createdAt_lte: dateTo },
                            ])
                        }
                        const ticketCount = await Ticket.count(context, { AND: query })
                        const status = statusesMap[type]
                        const stackObjectKey = isLineChart ? stackField : stackField.id
                        const groupObjectKey = isLineChart ? groupField.format(DATE_FORMAT) : status
                        result[stackObjectKey][groupObjectKey] = ticketCount
                        if (isLineChart) {
                            tableData.find((tableObj) => tableObj.date === groupField.format(DATE_FORMAT))[status] = ticketCount
                        } else {
                            // TODO: apply user properties from filter
                            const tableDataStatusCount = tableData.find(tableObj => tableObj.address === null)
                            if (tableDataStatusCount[status] === undefined) {
                                tableDataStatusCount[status] = ticketCount
                            } else {
                                tableDataStatusCount[status] += ticketCount
                            }
                        }
                    }
                }
                const axisLabels = isLineChart ?
                    daysMap.map(e => e.format(DATE_FORMAT)) :
                    Object.values(statusesMap)
                return { data: { result, labels, axisLabels, tableData, tableColumns: statusesMap } }
            },
        },
    ],
    mutations: [],
})

module.exports = {
    TicketReportService,
}
