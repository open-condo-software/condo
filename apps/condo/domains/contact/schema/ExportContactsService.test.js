const { makeLoggedInClient } = require('@condo/domains/user/utils/testSchema')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')
const { makeLoggedInAdminClient } = require('@condo/keystone/test.utils')
const { createTestContact } = require('@condo/domains/contact/utils/testSchema')
const { EXPORT_CONTACTS_TO_EXCEL } = require('@condo/domains/contact/gql')
const { makeClient } = require('@condo/keystone/test.utils')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const faker = require('faker')

describe('ExportContactsService', () => {
    describe('User', () => {
        it('can get contacts export from selected organization', async () => {
            const client = await makeClientWithProperty()
            await createTestContact(client, client.organization, client.property)

            const variables = {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                    where: { organization: { id: client.organization.id } },
                    sortBy: 'id_ASC',
                },
            }
            const { data: { result: { status, linkToFile } } } = await client.query(EXPORT_CONTACTS_TO_EXCEL, variables)

            expect(status).toBe('ok')
            expect(linkToFile).not.toHaveLength(0)
        })

        it('can not get contacts export from another organization', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)
            const client2 = await makeClientWithProperty()
            await createTestContact(client2, client2.organization, client2.property)

            const variables = {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                    where: { organization: { id: client2.organization.id } },
                    sortBy: 'id_ASC',
                },
            }
            const { data: { result }, errors } = await client.query(EXPORT_CONTACTS_TO_EXCEL, variables)

            expect(result).toBeNull()
            expect(errors).toHaveLength(1)
        })


        it('gets error with type NOTHING_TO_EXPORT if no contacts found', async () => {
            const client = await makeClientWithProperty()

            const variables = {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                    where: { organization: { id: client.organization.id } },
                    sortBy: 'id_ASC',
                },
            }
            const { data: { result }, errors } = await client.query(EXPORT_CONTACTS_TO_EXCEL, variables)

            expect(result).toBeNull()
            expect(errors).toMatchObject([{
                message: 'No contacts found to export',
                path: ['result'],
                extensions: {
                    query: 'exportContactsToExcel',
                    code: 'BAD_USER_INPUT',
                    type: 'NOTHING_TO_EXPORT',
                    message: 'No contacts found to export',
                },
            }])
        })

    })

    describe('Anonymous', () => {
        it('can not get contacts export', async () => {
            const client = await makeClient()
            const client2 = await makeClientWithProperty()
            await createTestContact(client2, client2.organization, client2.property)
            const { data: { result }, errors } = await client.query(EXPORT_CONTACTS_TO_EXCEL, {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) },
                    where: { organization: { id: client2.organization.id } },
                    sortBy: 'id_ASC',
                },
            })
            expect(result).toBeNull()
            expect(errors).toHaveLength(1)
        })
    })
})
