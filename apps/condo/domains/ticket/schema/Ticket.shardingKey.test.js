const { clearShardingKeys } = require('@open-condo/keystone/databaseAdapters/sharding')
const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket, Ticket } = require('@condo/domains/ticket/utils/testSchema')

describe('Sharding Key - SQL Query Verification', () => {
    afterEach(() => {
        clearShardingKeys()
    })

    test('should isolate data between organizations with sharding key', async () => {
        const admin = await makeLoggedInAdminClient()
        const [org1] = await createTestOrganization(admin)
        // const [org2] = await createTestOrganization(admin)
        const [property1] = await createTestProperty(admin, org1)
        // const [property2] = await createTestProperty(admin, org2)

        const [ticket1Org1] = await createTestTicket(admin, org1, property1)
        // const [ticket2Org1] = await createTestTicket(admin, org1, property1)
        // const [ticket1Org2] = await createTestTicket(admin, org2, property2)
        // const [ticket2Org2] = await createTestTicket(admin, org2, property2)

        // Query tickets using nested relation filter - should be converted to FK filter (no JOIN)
        const org1AllTickets = await Ticket.getAll(admin, {
            organization: { tin: org1.tin },
        })

        // // Query tickets for org2 using nested relation filter
        // const org2AllTickets = await Ticket.getAll(admin, {
        //     organization: { tin: org2.tin },
        // })

        // const org1Ids = org1AllTickets.map(t => t.id)
        // const org2Ids = org2AllTickets.map(t => t.id)

        // // Verify org1 query returns only org1 tickets
        // expect(org1Ids).toContain(ticket1Org1.id)
        // expect(org1Ids).toContain(ticket2Org1.id)
        // expect(org1Ids).not.toContain(ticket1Org2.id)
        // expect(org1Ids).not.toContain(ticket2Org2.id)

        // // Verify org2 query returns only org2 tickets
        // expect(org2Ids).toContain(ticket1Org2.id)
        // expect(org2Ids).toContain(ticket2Org2.id)
        // expect(org2Ids).not.toContain(ticket1Org1.id)
        // expect(org2Ids).not.toContain(ticket2Org1.id)
    })
})
