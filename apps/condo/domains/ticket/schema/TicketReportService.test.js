const moment =  require('moment')
const { sample } = require('lodash')
const { createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { createTestOrganizationEmployeeRole } = require('@condo/domains/organization/utils/testSchema')
const { makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee } = require('@condo/domains/organization/utils/testSchema')
const { NEW_OR_REOPENED_STATUS_TYPE, TICKET_STATUS_TYPES } = require('@condo/domains/ticket/constants')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { GET_TICKET_WIDGET_REPORT_DATA, GET_TICKET_ANALYTICS_REPORT_DATA } = require('@condo/domains/ticket/gql')
const { makeClient } = require('@core/keystone/test.utils')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')

const SELECTED_PERIOD = [moment().subtract(7, 'days').toISOString(), moment().toISOString()]
const ORGANIZATION_ACCESS_ERROR = '[error] you do not have access to this organization'
const [dateFrom, dateTo] = SELECTED_PERIOD
const TICKET_ANALYTICS_REPORT_DEFAULT_DATA = {
    dateFrom, dateTo,
    groupBy: 'status',
    viewMode: 'line',
    addressList: [],
    ticketType: 'default',
}

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
            expect(errors[0].message).toEqual(ORGANIZATION_ACCESS_ERROR)
            expect(result).toBeNull()
        })

        it('can get ticket report analytics data without role in organization', async () => {
            const client = await makeClientWithProperty()
            await createTestTicket(client, client.organization, client.property)

            const { data: { result: { data: { result, axisLabels, labels, tableColumns, tableData } } } } = await client
                .query(GET_TICKET_ANALYTICS_REPORT_DATA, {
                    data: {
                        userOrganizationId: client.organization.id,
                        ...TICKET_ANALYTICS_REPORT_DEFAULT_DATA,
                    },
                })

            const resultChartObject = result[sample(TICKET_STATUS_TYPES)]
            const dayDiff = moment(dateTo).diff(moment(dateFrom), 'days') + 1
            expect(Object.keys(result).sort()).toEqual(TICKET_STATUS_TYPES.sort())
            expect(Object.keys(labels).sort()).toEqual(TICKET_STATUS_TYPES.sort())
            expect(Object.keys(tableColumns).sort()).toEqual(TICKET_STATUS_TYPES.sort())
            expect(Object.keys(resultChartObject)).toHaveLength(dayDiff)
            expect(axisLabels).toHaveLength(dayDiff)
            expect(tableData.every(({ address }) => address === null)).toBeTruthy()
        })

        it('can get ticket report analytics data with role in organization', async () => {
            const { admin, organization } = await makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee()
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageEmployees: true,
            })
            const managerClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [employee] = await createTestOrganizationEmployee(admin, organization, managerClient.user, role, { isBlocked: false })

            const { data: { result: { data: { result, axisLabels, labels, tableColumns, tableData } } } } = await managerClient
                .query(GET_TICKET_ANALYTICS_REPORT_DATA, {
                    data: {
                        userOrganizationId: employee.organization.id,
                        ...TICKET_ANALYTICS_REPORT_DEFAULT_DATA,
                    },
                })
            const resultChartObject = result[sample(TICKET_STATUS_TYPES)]
            const dayDiff = moment(dateTo).diff(moment(dateFrom), 'days') + 1
            expect(Object.keys(result).sort()).toEqual(TICKET_STATUS_TYPES.sort())
            expect(Object.keys(labels).sort()).toEqual(TICKET_STATUS_TYPES.sort())
            expect(Object.keys(tableColumns).sort()).toEqual(TICKET_STATUS_TYPES.sort())
            expect(Object.keys(resultChartObject)).toHaveLength(dayDiff)
            expect(axisLabels).toHaveLength(dayDiff)
            expect(tableData.every(({ address }) => address === null)).toBeTruthy()
        })

        it('can not get ticket report analytics with another organization', async () => {
            const clientWithProperty = await makeClientWithProperty()
            await createTestTicket(clientWithProperty, clientWithProperty.organization, clientWithProperty.property)
            const client = await makeClientWithProperty()
            const { errors, data: { result } } = await client.query(GET_TICKET_ANALYTICS_REPORT_DATA, {
                data: {
                    userOrganizationId: clientWithProperty.organization.id, ...TICKET_ANALYTICS_REPORT_DEFAULT_DATA,
                },
            })
            console.log(errors[0])
            expect(errors).toHaveLength(1)
            expect(errors[0].message).toEqual(ORGANIZATION_ACCESS_ERROR)
            expect(result).toBeNull()
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
            const userAcceptOrganizationInveite = { isBlocked: false, isAccepted: true, isRejected: false }
            await createTestOrganizationEmployee(
                admin, organization, managerClient.user, role, { ...userRejectOrganizationInvite }
            )
            const [employee] = await createTestOrganizationEmployee(
                admin, organization, managerClient.user, role, { ...userAcceptOrganizationInveite }
            )
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
    })

    describe('Anonymous', () => {
        it('can not read ticket report ', async () => {
            const client = await makeClient()
            const client1 = await makeClientWithProperty()
            const { errors } = await client.query(GET_TICKET_WIDGET_REPORT_DATA, {
                data: { userOrganizationId: client1.organization.id, periodType: 'week' },
            })
            expect(errors).toHaveLength(1)
            expect(errors[0].name).toEqual('AuthenticationError')
        })

        it('can not read ticket report analytics data', async () => {
            const client = await makeClient()
            const client1 = await makeClientWithProperty()
            const [dateFrom, dateTo] = SELECTED_PERIOD
            const { errors } = await client.query(GET_TICKET_ANALYTICS_REPORT_DATA, {
                data: {
                    userOrganizationId: client1.organization.id,
                    dateFrom, dateTo,
                    groupBy: 'status',
                    viewMode: 'line',
                    addressList: [],
                    ticketType: 'default',
                },
            })

            expect(errors).toHaveLength(1)
            expect(errors[0].name).toEqual('AccessDeniedError')
        })
    })
})
