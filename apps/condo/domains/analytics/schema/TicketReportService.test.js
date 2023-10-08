const { faker } = require('@faker-js/faker')

const { expectToThrowAuthenticationErrorToResult, expectToThrowGraphQLRequestError, expectToThrowAccessDeniedErrorToResult } = require('@open-condo/keystone/test.utils')
const { makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { getTicketReport } = require('@condo/domains/analytics/utils/testSchema')
const { createTestOrganizationEmployeeRole } = require('@condo/domains/organization/utils/testSchema')
const { makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { NEW_OR_REOPENED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

describe('TicketReportService', () => {
    describe('Validations', () => {
        it('validates periodType field', async () => {
            const client = await makeClientWithProperty()

            await expectToThrowGraphQLRequestError(async () => {
                await getTicketReport(client, faker.datatype.string(), {
                    userOrganizationId: client.organization.id,
                })
            }, 'got invalid value')
        })
    })

    describe('User', () => {
        it('can get ticket report without role in organization', async () => {
            const client = await makeClientWithProperty()
            await createTestTicket(client, client.organization, client.property)
            const [data] = await getTicketReport(client, 'calendarWeek', {
                userOrganizationId: client.organization.id,
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
            const [data] = await getTicketReport(managerClient, 'calendarWeek', {
                userOrganizationId: employee.organization.id,
            })

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
            const managerClient1 = await makeClientWithNewRegisteredAndLoggedInUser()
            const userRejectOrganizationInvite = { isAccepted: false, isBlocked: false, isRejected: true }
            const userAcceptOrganizationInvite = { isAccepted: true, isBlocked: false, isRejected: false }
            await createTestOrganizationEmployee(
                admin, organization, managerClient.user, role, { ...userRejectOrganizationInvite }
            )
            const [employee] = await createTestOrganizationEmployee(
                admin, organization, managerClient1.user, role, { ...userAcceptOrganizationInvite }
            )
            const [data] = await getTicketReport(managerClient1, 'calendarWeek', {
                userOrganizationId: employee.organization.id,
            })

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
            const [data] = await getTicketReport(client, 'year', {
                userOrganizationId: client.organization.id,
            })

            expect(data).toBeInstanceOf(Array)
            expect(data.length).toBeGreaterThanOrEqual(1)
            const clientTicket = data.find(e => e.statusType === NEW_OR_REOPENED_STATUS_TYPE)
            expect(clientTicket).toBeDefined()
            expect(clientTicket.currentValue).toEqual(1)
            expect(clientTicket.growth).toEqual(0)
        })

        it('can\'t get ticket report from organization he not belongs to', async () => {
            const admin = await makeLoggedInAdminClient()
            const [organization] = await registerNewOrganization(admin)
            const client = await makeClientWithProperty()

            await expectToThrowAccessDeniedErrorToResult(async () => {
                await getTicketReport(client, 'year', {
                    userOrganizationId: organization.id,
                })
            })
        })
    })

    describe('Anonymous', () => {
        it('can not read ticket report ', async () => {
            const client = await makeClient()
            const client1 = await makeClientWithProperty()
            await expectToThrowAuthenticationErrorToResult(async () => {
                await getTicketReport(client, 'calendarWeek', {
                    userOrganizationId: client1.organization.id,
                })
            })
        })
    })
})
