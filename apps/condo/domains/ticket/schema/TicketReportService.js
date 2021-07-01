const { GQLCustomSchema } = require('@core/keystone/schema')
const { Ticket, TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const moment = require('moment')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const access = require('@condo/domains/ticket/access/Ticket')
const { TICKET_STATUS_TYPES: ticketTypes } = require('@condo/domains/ticket/constants')

const PERIOD_TYPES = ['week', 'month', 'quarter']

const countTicketsByStatuses = async (context, dateStart, dateEnd, organizationId) => {
    const answer = {}
    for (const type of ticketTypes) {
        const queryByStatus = [
            { createdAt_lte: dateEnd }, { createdAt_gte: dateStart },
            { status: { type } }, { organization: { id: organizationId } },
        ]
        const count = await Ticket.count(context, { AND: queryByStatus })
        answer[type] = count || 0
    }
    return answer
}

const TicketReportService = new GQLCustomSchema('TicketReportService', {
    types: [
        {
            access: true,
            type: 'input TicketReportWidgetInput { periodType: String! offset: Int, userOrganizationId: String! }',
        },
        {
            access: true,
            type: 'type TicketReportWidgetOutput { data: JSON }',
        },
    ],
    queries: [
        {
            access: access.canReadTickets,
            schema: 'ticketReportWidgetData(data: TicketReportWidgetInput!): TicketReportWidgetOutput',
            resolver: async (parent, args, context, info, extra) => {
                const { periodType, offset = 0, userOrganizationId } = args.data
                const hasAccess = await checkOrganizationPermission(context.authedItem.id, userOrganizationId, 'canManageTickets')
                if (!hasAccess) {
                    throw new Error('[error] you do not have access to this organization')
                }
                let statuses = await TicketStatus.getAll(context, { OR: [
                    { organization: { id: userOrganizationId } },
                    { organization_is_null: true },
                ] })

                statuses = statuses.filter(status =>
                    !(!status.organization && statuses
                        .find(organizationStatus => organizationStatus.organization !== null
                            && organizationStatus.type === status.type))
                )

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
