const { makeLoggedInClient, makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestTicket, createTestTicketComment } = require('@condo/domains/ticket/utils/testSchema')
const { EXPORT_TICKETS_TO_EXCEL } = require('@condo/domains/ticket/gql')
const { makeClient } = require('@core/keystone/test.utils')
const { makeClientWithProperty, createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const isObsConfigured = require('@condo/domains/common/utils/testSchema/isObsConfigured')
const faker = require('faker')
const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee
} = require('@condo/domains/organization/utils/testSchema')

describe('ExportTicketService', () => {
    describe('User', () => {
        it('can get tickets export from selected organization', async () => {
            if (isObsConfigured()) {
                const adminClient = await makeLoggedInAdminClient()
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(adminClient)
                const [property] = await createTestProperty(adminClient, organization)
                const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
                    canManageTickets: true,
                    canManageTicketComments: true,
                })
                await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

                const [ticket] = await createTestTicket(userClient, organization, property)
                // Generated file should contain created comments, examine it manually
                for (let i = 0; i < 10; i++) {
                    await createTestTicketComment(userClient, ticket, userClient.user)
                }
                const { data: { result: { status, linkToFile } } } = await userClient.query(EXPORT_TICKETS_TO_EXCEL, {
                    data: {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                        where: { organization: { id: organization.id } },
                        sortBy: 'id_ASC',
                        timeZone: DEFAULT_ORGANIZATION_TIMEZONE,
                    },
                })
                expect(status).toBe('ok')
                expect(linkToFile).not.toHaveLength(0)
                // TODO(antonal): automatically examine created export file
            }
        })

        it('can not get tickets export from another organization', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)
            const client2 = await makeClientWithProperty()
            await createTestTicket(client2, client2.organization, client2.property)
            const { data: { result }, errors } = await client.query(EXPORT_TICKETS_TO_EXCEL, {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                    where: { organization: { id: client2.organization.id } },
                    sortBy: 'id_ASC', timeZone: DEFAULT_ORGANIZATION_TIMEZONE,
                },
            })
            expect(result).toBeNull()
            expect(errors).toHaveLength(1)
        })

        it('receives error of tickets for export are not found', async () => {
            const client = await makeClientWithProperty()
            const { data: { result }, errors } = await client.query(EXPORT_TICKETS_TO_EXCEL, {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                    where: { organization: { id: client.organization.id } },
                    sortBy: 'id_ASC',
                    timeZone: DEFAULT_ORGANIZATION_TIMEZONE,
                },
            })
            expect(result).toBeNull()
            expect(errors).toMatchObject([{
                message: 'No tickets found to export',
                path: ['result'],
                extensions: {
                    query: 'exportTicketsToExcel',
                    code: 'BAD_USER_INPUT',
                    type: 'NOTHING_TO_EXPORT',
                    message: 'No tickets found to export',
                },
            }])
        })

    })

    describe('Anonymous', () => {
        it('can not get tickets export', async () => {
            const client = await makeClient()
            const client2 = await makeClientWithProperty()
            await createTestTicket(client2, client2.organization, client2.property)
            const { data: { result }, errors } = await client.query(EXPORT_TICKETS_TO_EXCEL, {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                    where: { organization: { id: client2.organization.id } },
                    sortBy: 'id_ASC',
                    timeZone: DEFAULT_ORGANIZATION_TIMEZONE,
                },
            })
            expect(result).toBeNull()
            expect(errors).toHaveLength(1)
        })
    })
})
