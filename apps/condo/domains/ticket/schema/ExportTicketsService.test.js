const { makeLoggedInClient } = require('@condo/domains/user/utils/testSchema')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { EXPORT_TICKETS_TO_EXCEL } = require('@condo/domains/ticket/gql')
const { makeClient } = require('@core/keystone/test.utils')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const isObsConfigured = require('@condo/domains/common/utils/testSchema/isObsConfigured')

describe('ExportTicketService', () => {
    describe('User', () => {
        it('can get tickets export from selected organization', async () => {
            if (isObsConfigured()) {
                const client = await makeClientWithProperty()
                await createTestTicket(client, client.organization, client.property)
                const { data: { result: { status, linkToFile } } }  = await client.query(EXPORT_TICKETS_TO_EXCEL, {
                    data: { where: { organization: { id: client.organization.id } }, sortBy: 'id_ASC', timeZone: DEFAULT_ORGANIZATION_TIMEZONE },
                })
                expect(status).toBe('ok')
                expect(linkToFile).not.toHaveLength(0)
            }
        })

        it('can not get tickets export from another organization', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)
            const client2 = await makeClientWithProperty()
            await createTestTicket(client2, client2.organization, client2.property)
            const { data: { result }, errors } = await client.query(EXPORT_TICKETS_TO_EXCEL, {
                data: { where: { organization: { id: client2.organization.id } }, sortBy: 'id_ASC', timeZone: DEFAULT_ORGANIZATION_TIMEZONE },
            })
            expect(result).toBeNull()
            expect(errors).toHaveLength(1)
        })

    })

    describe('Anonymous', () => {
        it('can not get tickets export', async () => {
            const client = await makeClient()
            const client2 = await makeClientWithProperty()
            await createTestTicket(client2, client2.organization, client2.property)
            const { data: { result }, errors } = await client.query(EXPORT_TICKETS_TO_EXCEL, {
                data: { where: { organization: { id: client2.organization.id } }, sortBy: 'id_ASC', timeZone: DEFAULT_ORGANIZATION_TIMEZONE },
            })
            expect(result).toBeNull()
            expect(errors).toHaveLength(1)
        })
    })
})
