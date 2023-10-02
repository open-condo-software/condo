/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { createTestTicket, Ticket } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

const { closeCompletedTickets, ERROR_START_TICKET_CLOSING } = require('./closeCompletedTickets')


describe('closeCompletedTickets', () => {
    setFakeClientMode(index)
    let admin
    let organization, organization2, property, property2
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    beforeEach(async () => {
        admin = await makeLoggedInAdminClient()
        const residentClient = await makeClientWithResidentUser()

        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization
        const [testOrganization2] = await createTestOrganization(admin)
        organization2 = testOrganization2
        const [testProperty] = await createTestProperty(admin, organization)
        property = testProperty
        const [testProperty2] = await createTestProperty(admin, organization2)
        property2 = testProperty2
        const unitName = faker.random.alphaNumeric(5)
        const unitType = FLAT_UNIT_TYPE

        await createTestResident(admin, residentClient.user, property, {
            unitName,
            unitType,
        })
        await createTestResident(admin, residentClient.user, property2, {
            unitName,
            unitType,
        })
    })

    describe('closeCompletedTicketsWithLimitByOrganizations', () => {
        it('should close ticket', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })

            await closeCompletedTickets()

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(updatedTicket.status.id).toBe(STATUS_IDS.CLOSED)
        })
        it('should close one ticket from each organization', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })
            const [ticket2] = await createTestTicket(admin, organization, property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })
            const [ticket3] = await createTestTicket(admin, organization2, property2, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })
            const [ticket4] = await createTestTicket(admin, organization2, property2, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })

            await closeCompletedTickets(1)

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })
            const updatedTicket2 = await Ticket.getOne(admin, { id: ticket2.id })
            const updatedTicket3 = await Ticket.getOne(admin, { id: ticket3.id })
            const updatedTicket4 = await Ticket.getOne(admin, { id: ticket4.id })

            expect(updatedTicket.status.id).toBe(STATUS_IDS.CLOSED)
            expect(updatedTicket2.status.id).toBe(STATUS_IDS.COMPLETED)
            expect(updatedTicket3.status.id).toBe(STATUS_IDS.CLOSED)
            expect(updatedTicket4.status.id).toBe(STATUS_IDS.COMPLETED)
        })
        it('should close only 1 tickets', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })

            const [ticket2] = await createTestTicket(admin, organization, property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })

            await closeCompletedTickets(1)

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })
            const updatedTicket2 = await Ticket.getOne(admin, { id: ticket2.id })

            expect(updatedTicket.status.id).toBe(STATUS_IDS.CLOSED)
            expect(updatedTicket2.status.id).toBe(STATUS_IDS.COMPLETED)
        })
        it('should not close ticket', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'weeks').toISOString(),
            })

            await catchErrorFrom(async () => {
                await closeCompletedTickets(0)
            }, (error) => {
                expect(error.message).toMatch(ERROR_START_TICKET_CLOSING)
            })

            await catchErrorFrom(async () => {
                await closeCompletedTickets(-100)
            }, (error) => {
                expect(error.message).toMatch(ERROR_START_TICKET_CLOSING)
            })

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(updatedTicket.status.id).toBe(STATUS_IDS.COMPLETED)
        })
        it('should not close a ticket that was completed recently', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                statusUpdatedAt: dayjs().subtract(2, 'days').toISOString(),
            })

            await closeCompletedTickets()

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(updatedTicket.status.id).toBe(STATUS_IDS.COMPLETED)
        })
    })
})
