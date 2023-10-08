const dayjs = require('dayjs')
const isoWeek = require('dayjs/plugin/isoWeek')
const quarterOfYear = require('dayjs/plugin/quarterOfYear')

const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/ticket/access/TicketReportService')
const { TICKET_STATUS_TYPES: ticketStatusTypes } = require('@condo/domains/ticket/constants')
const { Ticket, TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const PERIOD_TYPES = ['calendarWeek', 'month', 'quarter', 'year']
const PERIOD_OFFSET_MAP = {
    calendarWeek: 'week',
    month: 'month',
    quarter: 'quarter',
    year: 'year',
}

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
    const statuses = await TicketStatus.getAll(context, { OR: [
        { organization: { id: userOrganizationId } },
        { organization_is_null: true },
    ] })

    return statuses.filter(status => {
        if (!status.organization) { return true }
        return !statuses
            .find(organizationStatus => organizationStatus.organization !== null && organizationStatus.type === status.type)
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
            // TODO(pahaz): change `userOrganizationId: String!` to `userOrganization: OrganizationWhereUniqueInput!` or `organization: OrganizationWhereUniqueInput!`
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
    ],
    queries: [
        {
            access: access.canReadTicketReportWidgetData,
            schema: 'ticketReportWidgetData(data: TicketReportWidgetInput!): TicketReportWidgetOutput',
            resolver: async (parent, args, context) => {
                const { periodType, offset = 0, userOrganizationId } = args.data
                const statuses = await getOrganizationStatuses(context, userOrganizationId)
                const statusesMap = Object.fromEntries(statuses.map(({ type, name }) => ([type, name])))

                dayjs.extend(isoWeek)
                dayjs.extend(quarterOfYear)

                const offsetPeriod = PERIOD_OFFSET_MAP[periodType]
                const startDate = dayjs().isoWeekday(1).startOf(periodType).startOf('day').add(offset, offsetPeriod).toISOString()
                const previousStartDate = dayjs().isoWeekday(1).startOf(periodType).startOf('day').add(offset - 1, offsetPeriod).toISOString()
                const endDate = dayjs().isoWeekday(7).endOf(periodType).endOf('day').add(offset, offsetPeriod).toISOString()
                const previousEndDate =  dayjs().isoWeekday(7).endOf(periodType).endOf('day').add(offset - 1, offsetPeriod).toISOString()
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
    ],
    mutations: [],
})

module.exports = {
    TicketReportService,
}
