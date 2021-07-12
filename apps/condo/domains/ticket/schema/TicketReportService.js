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
            type: 'input TicketReportAnalyticsInput { dateFrom: String!, dateTo: String!, groupBy: String!, userOrganizationId: String!, ticketType: TicketType!, viewMode: ChartViewMode! }',
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
                const { dateFrom, dateTo, groupBy, userOrganizationId, ticketType, viewMode } = args.data
                const statuses = await getOrganizationStatuses(context, userOrganizationId)
                const statusesMap = Object.fromEntries(statuses.map(({ type, name }) => ([type, name])))
                const userProperties = await getOrganizationProperties(context, userOrganizationId)
                const userPropertiesMap = Object.fromEntries(userProperties.map(({ id, address }) => ([id, address])))
                const daysCount = moment(dateTo).diff(moment(dateFrom), 'days')
                const daysMap = Array.from({ length: daysCount }, (_, day) => moment(dateFrom).add(day, 'days'))
                const labels = viewMode ===  'line' ? statusesMap : userPropertiesMap

                const result = {}
                const tableData = Array.from({ length: daysCount }, (_, day) => ({
                    date: daysMap[day].format('DD.MM.YYYY'),
                    address: 'Все адреса',
                }))
                if (viewMode === 'line') {
                    for (const type of ticketStatusTypes) {
                        result[type] = {}
                        for (const day of daysMap) {
                            const date = day.format('DD.MM.YYYY')
                            const query = [
                                { createdAt_gte: day.startOf('day').toISOString() },
                                { createdAt_lte: day.endOf('day').toISOString() },
                                { status: { type } }, { organization: { id: userOrganizationId } },
                                { isPaid: ticketType === 'paid', isEmergency: ticketType === 'emergency' },
                            ]

                            const ticketCount = await Ticket.count(context, { AND: query })
                            const status = statusesMap[type]
                            result[type][date] = ticketCount
                            tableData.find((tableObj) => tableObj.date === date)[status] = ticketCount
                        }
                    }
                } else {
                    for (const property of userProperties) {
                        const { id } = property
                        result[id] = {}
                        for (const type of ticketStatusTypes) {
                            const query = [
                                { createdAt_gte: dateFrom },
                                { createdAt_lte: dateTo },
                                { status: { type } }, { organization: { id: userOrganizationId } },
                                { isPaid: ticketType === 'paid', isEmergency: ticketType === 'emergency' },
                                { property: { id } },
                            ]
                            result[id][type] = await Ticket.count(context, { AND: query })
                        }
                    }
                }
                const axisLabels = viewMode === 'line' ? daysMap.map(e => e.format('DD.MM.YYYY')) : Object.values(userPropertiesMap)
                return { data: { result, labels, axisLabels, tableData } }
            },
        },
    ],
    mutations: [],
})

module.exports = {
    TicketReportService,
}
