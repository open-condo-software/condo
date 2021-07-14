const { v4: uuid } = require('uuid')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { SHARE_TICKET_MUTATION } = require('@condo/domains/ticket/gql')
const { makeClient } = require('@core/keystone/test.utils')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')

describe('ShareTicketService', () => {
    describe('User', () => {
        it('can share ticked with selected organization', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)

            const res = await client.mutate(SHARE_TICKET_MUTATION, {
                data: { sender: client.userAttrs.sender, users: [client.user.id], ticketId: ticket.id },
            })

            expect(res).toEqual({ data: { obj: { status: 'ok' } } })
        })

        it('can not share ticked with another organization', async () => {
            const client = await makeClientWithProperty()
            const client1 = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)

            const { errors, data }  = await client1.mutate(SHARE_TICKET_MUTATION, {
                data: { sender: client.userAttrs.sender, users: [client.user.id], ticketId: ticket.id },
            })

            expect(errors).toHaveLength(1)
            expect(data).toEqual({ obj: null })
        })
    })

    describe('Anonymous', () => {
        it('can not share ticked', async () => {
            const client = await makeClientWithProperty()
            const client1 = await makeClient()
            const [ticket] = await createTestTicket(client, client.organization, client.property)

            const { errors, data } = await client1.mutate(SHARE_TICKET_MUTATION, {
                data: { sender: client.userAttrs.sender, users: [uuid()], ticketId: ticket.id },
            })

            expect(errors).toHaveLength(1)
            expect(errors[0].name).toEqual('AccessDeniedError')
            expect(data).toEqual({ obj: null })
        })
    })
})
