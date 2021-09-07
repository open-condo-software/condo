const { GQLCustomSchema } = require('@core/keystone/schema')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { SHARE_TICKET_MESSAGE_TYPE } = require('@condo/domains/notification/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const access = require('@condo/domains/ticket/access/ShareTicketService')

const ShareTicketService = new GQLCustomSchema('ShareTicketService', {
    types: [
        {
            access: true,
            type: 'input ShareTicketInput { sender: SenderFieldInput!, users: [ID!]!, ticketId: ID! }',
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
                const { users, ticketId, sender } = data
                const [ticket] = await Ticket.getAll(context, { id: ticketId })

                const lang = COUNTRIES[RUSSIA_COUNTRY].locale

                await Promise.all(
                    users.map((id) =>
                        sendMessage(context, {
                            lang,
                            to: {
                                user: {
                                    id,
                                },
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
                        }),
                    ),
                )

                return { status: 'ok' }
            },
        },
    ],
})

module.exports = {
    ShareTicketService,
}
