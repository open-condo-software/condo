const { createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { createTestOrganizationEmployeeRole } = require('@condo/domains/organization/utils/testSchema')
const { makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee } = require('@condo/domains/organization/utils/testSchema')
const { NEW_OR_REOPENED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { GET_TICKET_WIDGET_REPORT_DATA } = require('@condo/domains/ticket/gql')
const { makeClient } = require('@core/keystone/test.utils')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')

describe('TicketReportService', () => {
    describe('Validations', () => {
        it('validates periodType field', async () => {
            const client = await makeClientWithProperty()
            const { errors } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client.organization.id, periodType: 'notExistingType' },
            })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                name: 'UserInputError',
                message: 'Variable "$data" got invalid value "notExistingType" at "data.periodType"; Value "notExistingType" does not exist in "TicketReportPeriodType" enum.',
            }])
        })
    })

    describe('User', () => {
        it('can get ticket report without role in organization', async () => {
            const client = await makeClientWithProperty()
            await createTestTicket(client, client.organization, client.property)
            const { data: { result: { data } } } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client.organization.id, periodType: 'calendarWeek' },
            })
            expect(data).toBeInstanceOf(Array)
            expect(data.length).toBeGreaterThanOrEqual(1)
            const clientTicket = data.find(e => e.statusType === NEW_OR_REOPENED_STATUS_TYPE)
            expect(clientTicket).toBeDefined()
            expect(clientTicket.currentValue).toEqual(1)
            expect(clientTicket.growth).toEqual(0)
        })

        it('can get ticket report with role in organization', async () => {
            const { admin, organization } = await makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee()
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageEmployees: true,
            })
            const managerClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [employee] = await createTestOrganizationEmployee(admin, organization, managerClient.user, role, {
                isBlocked: false, isAccepted: true, isRejected: false,
            })
            const { data: { result: { data } } } = await managerClient.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: employee.organization.id, periodType: 'calendarWeek' } }
            )
            expect(data).toBeInstanceOf(Array)
            expect(data.length).toBeGreaterThanOrEqual(1)
            const clientTicket = data.find(e => e.statusType === NEW_OR_REOPENED_STATUS_TYPE)
            expect(clientTicket).toBeDefined()
            expect(clientTicket.currentValue).toEqual(0)
            expect(clientTicket.growth).toEqual(0)
        })

        it('can get ticket report with multiple organization invites',  async () => {
            // Test checks for an error when the user first declined the invitation and then accepted it
            // It causes getByCondition return multiple values error
            const { admin, organization } = await makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee()
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: true,
            })
            const managerClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const userRejectOrganizationInvite = { isBlocked: false, isAccepted: false, isRejected: true }
            const userAcceptOrganizationInvite = { isBlocked: false, isAccepted: true, isRejected: false }
            await createTestOrganizationEmployee(
                admin, organization, managerClient.user, role, { ...userRejectOrganizationInvite }
            )
            const [employee] = await createTestOrganizationEmployee(
                admin, organization, managerClient.user, role, { ...userAcceptOrganizationInvite }
            )
            const { data: { result: { data } } } = await managerClient.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: employee.organization.id, periodType: 'calendarWeek' } }
            )
            expect(data).toBeInstanceOf(Array)
            expect(data.length).toBeGreaterThanOrEqual(1)
            const clientTicket = data.find(e => e.statusType === NEW_OR_REOPENED_STATUS_TYPE)
            expect(clientTicket).toBeDefined()
            expect(clientTicket.currentValue).toEqual(0)
            expect(clientTicket.growth).toEqual(0)
        })

        it('can get ticket report with allowed period types [year]', async () => {
            const client = await makeClientWithProperty()
            await createTestTicket(client, client.organization, client.property)
            const { data: { result: { data } } } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client.organization.id, periodType: 'year' },
            })
            expect(data).toBeInstanceOf(Array)
            expect(data.length).toBeGreaterThanOrEqual(1)
            const clientTicket = data.find(e => e.statusType === NEW_OR_REOPENED_STATUS_TYPE)
            expect(clientTicket).toBeDefined()
            expect(clientTicket.currentValue).toEqual(1)
            expect(clientTicket.growth).toEqual(0)
        })

        it('can not get ticket report with restricted period type', async () => {
            const client = await makeClientWithProperty()
            const { errors } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client.organization.id, periodType: 'hour' },
            })
            console.log(errors)
            expect(errors).toBeDefined()
            expect(errors).toHaveLength(1)
            expect(errors[0].name).toEqual('UserInputError')
        })
    })

    describe('Anonymous', () => {
        it('can not read ticket report ', async () => {
            const client = await makeClient()
            const client1 = await makeClientWithProperty()
            const { errors } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client1.organization.id, periodType: 'calendarWeek' },
            })
            expect(errors).toHaveLength(1)
            expect(errors[0].name).toEqual('AuthenticationError')
        })
    })
})
