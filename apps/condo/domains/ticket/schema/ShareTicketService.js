const { GQLCustomSchema } = require('@core/keystone/schema')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { SHARE_TICKET_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const access = require('@condo/domains/ticket/access/ShareTicketService')

// TODO(zuch): rename users to employees
const ShareTicketService = new GQLCustomSchema('ShareTicketService', {
    types: [
        {
            access: true,
            type: 'input ShareTicketInput { sender: SenderFieldInput!, employees: [ID!]!, ticketId: ID! }',
        },
        {
            access: true,
            type: 'type ShareTicketOutput { status: String! }',
        },
    ],
    mutations: [
        {
            access: access.canShareTicket,
            schema: 'shareTicket(data: ShareTicketInput!): ShareTicketOutput',
            resolver: async (parent, args, context) => {
                const { data } = args
                const { employees, ticketId, sender } = data
                const [ticket] = await Ticket.getAll(context, { id: ticketId })
                const employeeUsers = await OrganizationEmployee.getAll(context, { id_in: employees })
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale

                await Promise.all(employeeUsers.map(employee => {
                    return sendMessage(context, {
                        lang,
                        to: {
                            email: employee.email,
                            ...employee.user ? { user: { id: employee.user.id } } : {},
                        },
                        type: SHARE_TICKET_MESSAGE_TYPE,
                        meta: {
                            dv: 1,
                            ticketNumber: ticket.number,
                            date: ticket.createdAt,
                            id: ticket.id,
                            details: ticket.details,
                        },
                        sender,
                        organization: employee.organization && { id: employee.organization.id },
                    })
                }))
                return { status: 'ok' }
            },
        },
    ],
})

module.exports = {
    ShareTicketService,
}
