const { makeClient } = require('@open-condo/keystone/test.utils')

const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { SHARE_TICKET_MUTATION } = require('@condo/domains/ticket/gql')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')

describe('ShareTicketService', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('User', () => {
        it('can share ticket with same organization', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)
            // TODO(zuch): add another employee, share ticket, check if Message appears in db
            const mutationResult = await client.mutate(SHARE_TICKET_MUTATION, {
                data: { sender: client.userAttrs.sender, employees: [client.user.id], ticketId: ticket.id },
            })
            const { data: { obj: { status } } } = mutationResult
            expect(status).toBe('ok')
        })

        it('can not share ticket with another organization', async () => {
            const client = await makeClientWithProperty()
            const client1 = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)

            const { errors, data }  = await client1.mutate(SHARE_TICKET_MUTATION, {
                data: { sender: client.userAttrs.sender, employees: [client.user.id], ticketId: ticket.id },
            })

            expect(errors).toHaveLength(1)
            expect(data).toEqual({ obj: null })
        })
    })

    describe('Anonymous', () => {
        it('can not share ticket', async () => {
            const client = await makeClientWithProperty()
            const client1 = await makeClient()
            const [ticket] = await createTestTicket(client, client.organization, client.property)

            const { errors, data } = await client1.mutate(SHARE_TICKET_MUTATION, {
                data: { sender: client.userAttrs.sender, employees: [client.user.id], ticketId: ticket.id },
            })

            expect(errors).toHaveLength(1)
            expect(errors[0].name).toBe('AuthenticationError')
            expect(data).toEqual({ obj: null })
        })
    })
})
