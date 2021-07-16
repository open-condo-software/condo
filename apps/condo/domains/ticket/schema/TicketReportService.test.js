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
    describe('User', () => {
        it('can get ticket report without role in organization', async () => {
            const client = await makeClientWithProperty()
            await createTestTicket(client, client.organization, client.property)
            const { data: { result: { data } } } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client.organization.id, periodType: 'week' },
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
                data: { userOrganizationId: employee.organization.id, periodType: 'week' } }
            )
            expect(data).toBeInstanceOf(Array)
            expect(data.length).toBeGreaterThanOrEqual(1)
            const clientTicket = data.find(e => e.statusType === NEW_OR_REOPENED_STATUS_TYPE)
            expect(clientTicket).toBeDefined()
            expect(clientTicket.currentValue).toEqual(0)
            expect(clientTicket.growth).toEqual(0)
        })

        it('can not get ticket report with another organization', async () => {
            const clientWithProperty = await makeClientWithProperty()
            await createTestTicket(clientWithProperty, clientWithProperty.organization, clientWithProperty.property)

            const client = await makeClientWithProperty()
            const { errors, data: { result } } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: clientWithProperty.organization.id, periodType: 'week' } }
            )
            expect(errors).toHaveLength(1)
            expect(result).toBeNull()
        })
    })

    describe('Anonymous', () => {
        it('can not read ticket report ', async () => {
            const client = await makeClient()
            const client1 = await makeClientWithProperty()
            const { errors } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client1.organization.id, periodType: 'week' },
            })
            expect(errors).toHaveLength(1)
            expect(errors[0].name).toEqual('AccessDeniedError')
        })
    })
})
