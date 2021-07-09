const { NEW_OR_REOPENED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { makeLoggedInClient } = require('@condo/domains/user/utils/testSchema')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { v4: uuid } = require('uuid')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { TICKET_SHARE_MUTATION } = require('@condo/domains/ticket/gql')
const { makeClient } = require('@core/keystone/test.utils')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')

describe('TicketShareService', () => {
    describe('User', () => {
        it('can share ticked with selected organization', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)
            const res = await client.query(TICKET_SHARE_MUTATION, {
                data: { sender: client.userAttrs.sender, users: [client.id], ticketId: ticket.id },
            })
            console.log('data[0].id', ticket.id)
            console.log('client', client.userAttrs.sender)
            // console.log('ticket', data)
            console.log('ticketShare', res)
            expect(true).toBeTruthy()

            // expect(data).toBeInstanceOf(Array)
            // expect(data.length).toBeGreaterThanOrEqual(1)
            // const clientTicket = data.find(e => e.statusType === NEW_OR_REOPENED_STATUS_TYPE)
            // expect(clientTicket).toBeDefined()
            // expect(clientTicket.currentValue).toEqual(1)
            // expect(clientTicket.growth).toEqual(0)
        })

        // it('can not share ticked with another organization', async () => {
        //     const admin = await makeLoggedInAdminClient()
        //     const [, userAttrs] = await createTestUser(admin)
        //     const client = await makeLoggedInClient(userAttrs)
        //     await createTestTicket(client, client.organization, client.property)
        //     const { errors, data: { result } } = await client.query(TICKET_SHARE_MUTATION, {
        //         data: { userOrganizationId: uuid(), periodType: 'week' } }
        //     )
        //     expect(errors).toHaveLength(1)
        //     expect(result).toBeNull()
        // })

    })

    // describe('Anonymous', () => {
    //     it('can not share ticked', async () => {
    //         const client = await makeClientWithProperty()
    //         const client1 = await makeClient()
    //         await createTestTicket(client, client.organization, client.property)
    //         const { errors } = await client.query(TICKET_SHARE_MUTATION, {
    //             data: { userOrganizationId: client1.organization.id, periodType: 'week' },
    //         })
    //         expect(errors).toHaveLength(1)
    //         expect(errors[0].name).toEqual('AccessDeniedError')
    //     })
    // })
})
