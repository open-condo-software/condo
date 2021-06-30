const { GQLCustomSchema } = require('@core/keystone/schema')
const { Ticket, TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const moment = require('moment')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const access = require('@condo/domains/ticket/access/Ticket')

const PERIOD_TYPES = ['week', 'month', 'quarter']

const countTicketsByStatuses = async (context, statues, dateStart, dateEnd) => {
    const answer = {}
    for (const status of statues) {
        const queryByStatus = [{ createdAt_lte: dateEnd }, { createdAt_gte: dateStart }, { status: { name: status } }]
        const count = await Ticket.count(context, { AND: queryByStatus })
        answer[status] = count || 0
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
                    throw new Error('[error] yot do not have access to this organization')
                }
                const statuses = await TicketStatus.getAll(context, { OR: [
                    { organization: { id: userOrganizationId } },
                    { organization_is_null: true },
                ] })
                const statusNames = statuses.map(status => status.name)
                if (!PERIOD_TYPES.includes(periodType)) {
                    throw new Error(`[error] possible period types are: ${PERIOD_TYPES.join(', ')}`)
                }
                const startDate = moment().startOf(periodType).add(offset, periodType).toISOString()
                const previousStartDate = moment().startOf(periodType).add(offset - 1, periodType).toISOString()
                const endDate = moment().endOf(periodType).add(offset, periodType).toISOString()
                const previousEndDate =  moment().endOf(periodType).add(offset - 1, periodType).toISOString()


                const currentData = await countTicketsByStatuses(context, statusNames, startDate, endDate)
                const previousData = await countTicketsByStatuses(context, statusNames, previousStartDate, previousEndDate)

                const data = []
                Object.entries(currentData).forEach((e) => {
                    const [statusName, currentValue] = e
                    const previousValue = previousData[statusName]
                    let growth = 0
                    if (previousValue !== 0 && currentValue !== 0) {
                        growth = Number((currentValue * 100 / previousValue - 100).toFixed(2))
                    }

                    data.push({
                        statusName,
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
