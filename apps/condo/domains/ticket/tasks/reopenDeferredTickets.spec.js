/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const { get } = require('lodash')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
    updateTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const { Ticket, createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithResidentUser, makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { reopenDeferredTickets } = require('./reopenDeferredTickets')

const { STATUS_IDS } = require('../constants/statusTransitions')


describe('reopenDeferredTickets', () => {
    setFakeClientMode(index)
    let admin
    let client, client2, employee, employee2, organization, property
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const residentClient = await makeClientWithResidentUser()

        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization
        const [testProperty] = await createTestProperty(admin, organization)
        property = testProperty
        const unitName = faker.random.alphaNumeric(5)
        const unitType = FLAT_UNIT_TYPE

        await createTestResident(admin, residentClient.user, property, {
            unitName,
            unitType,
        })
    })
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    beforeEach(async () => {
        client = await makeClientWithNewRegisteredAndLoggedInUser()
        client2 = await makeClientWithNewRegisteredAndLoggedInUser()
        const [role] = await createTestOrganizationEmployeeRole(admin, organization)
        const [testEmployee] = await createTestOrganizationEmployee(admin, organization, client.user, role, {})
        employee = testEmployee
        const [testEmployee2] = await createTestOrganizationEmployee(admin, organization, client2.user, role, {})
        employee2 = testEmployee2
    })

    const cases = ['blocked', 'deleted']

    describe.each(cases)('%p employees', (type) => {
        let employeePayload = {}
        beforeAll(() => {
            switch (type) {
                case 'blocked':
                    employeePayload = { isBlocked: true }
                    break
                case 'deleted':
                    employeePayload = { deletedAt: dayjs().toISOString() }
                    break
            }
        })

        it('should reopen ticket and reset dismissed executor and assignee (1 employee)', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                deferredUntil: dayjs().toISOString(),
                executor: { connect: { id: employee.user.id } },
                assignee: { connect: { id: employee.user.id } },
                status: { connect: { id: STATUS_IDS.DEFERRED } },
            })

            await updateTestOrganizationEmployee(admin, employee.id, employeePayload)

            await reopenDeferredTickets()

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(get(updatedTicket, ['executor', 'id'], null)).toBeNull()
            expect(get(updatedTicket, ['assignee', 'id'], null)).toBeNull()
        })
        it('should reopen ticket and reset dismissed executor and assignee (2 different employees)', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                deferredUntil: dayjs().toISOString(),
                executor: { connect: { id: employee2.user.id } },
                assignee: { connect: { id: employee.user.id } },
                status: { connect: { id: STATUS_IDS.DEFERRED } },
            })

            await updateTestOrganizationEmployee(admin, employee.id, employeePayload)
            await updateTestOrganizationEmployee(admin, employee2.id, employeePayload)

            await reopenDeferredTickets()

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(get(updatedTicket, ['executor', 'id'], null)).toBeNull()
            expect(get(updatedTicket, ['assignee', 'id'], null)).toBeNull()
        })
        it('should reopen ticket and save existed executor and reset dismissed assignee', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                deferredUntil: dayjs().toISOString(),
                executor: { connect: { id: employee2.user.id } },
                assignee: { connect: { id: employee.user.id } },
                status: { connect: { id: STATUS_IDS.DEFERRED } },
            })

            await updateTestOrganizationEmployee(admin, employee.id, employeePayload)

            await reopenDeferredTickets()

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(get(updatedTicket, ['executor', 'id'], null)).toEqual(get(client2, 'user.id'))
            expect(get(updatedTicket, ['assignee', 'id'], null)).toBeNull()
        })
        it('should reopen ticket and reset dismissed executor and save existed assignee', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                deferredUntil: dayjs().toISOString(),
                executor: { connect: { id: employee2.user.id } },
                assignee: { connect: { id: employee.user.id } },
                status: { connect: { id: STATUS_IDS.DEFERRED } },
            })

            await updateTestOrganizationEmployee(admin, employee2.id, employeePayload)

            await reopenDeferredTickets()

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(get(updatedTicket, ['executor', 'id'], null)).toBeNull()
            expect(get(updatedTicket, ['assignee', 'id'], null)).toEqual(get(client, 'user.id'))
        })
        it('should reopen ticket without executor and reset dismissed assignee', async () => {
            const [ticket] = await createTestTicket(admin, organization, property, {
                deferredUntil: dayjs().toISOString(),
                assignee: { connect: { id: employee.user.id } },
                status: { connect: { id: STATUS_IDS.DEFERRED } },
            })

            await updateTestOrganizationEmployee(admin, employee.id, employeePayload)

            await reopenDeferredTickets()

            const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

            expect(get(updatedTicket, ['executor', 'id'], null)).toBeNull()
            expect(get(updatedTicket, ['assignee', 'id'], null)).toBeNull()
        })
    })
    it('should reopen ticket without executor and assignee', async () => {
        const [ticket] = await createTestTicket(admin, organization, property, {
            deferredUntil: dayjs().toISOString(),
            status: { connect: { id: STATUS_IDS.DEFERRED } },
        })

        await reopenDeferredTickets()

        const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

        expect(get(updatedTicket, ['executor', 'id'], null)).toBeNull()
        expect(get(updatedTicket, ['assignee', 'id'], null)).toBeNull()
    })
    it('should reopen ticket and save existed executor and assignee (1 employee)', async () => {
        const [ticket] = await createTestTicket(admin, organization, property, {
            deferredUntil: dayjs().toISOString(),
            executor: { connect: { id: employee.user.id } },
            assignee: { connect: { id: employee.user.id } },
            status: { connect: { id: STATUS_IDS.DEFERRED } },
        })

        await reopenDeferredTickets()

        const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

        expect(get(updatedTicket, ['executor', 'id'], null)).toEqual(get(client, 'user.id'))
        expect(get(updatedTicket, ['assignee', 'id'], null)).toEqual(get(client, 'user.id'))
    })
    it('should reopen ticket and save existed executor and assignee (2 different employees)', async () => {
        const [ticket] = await createTestTicket(admin, organization, property, {
            deferredUntil: dayjs().toISOString(),
            executor: { connect: { id: employee2.user.id } },
            assignee: { connect: { id: employee.user.id } },
            status: { connect: { id: STATUS_IDS.DEFERRED } },
        })

        await reopenDeferredTickets()

        const updatedTicket = await Ticket.getOne(admin, { id: ticket.id })

        expect(get(updatedTicket, ['executor', 'id'], null)).toEqual(get(client2, 'user.id'))
        expect(get(updatedTicket, ['assignee', 'id'], null)).toEqual(get(client, 'user.id'))
    })
})
