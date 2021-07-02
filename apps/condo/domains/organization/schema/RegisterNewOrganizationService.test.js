const faker = require('faker')

const { makeLoggedInClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')

const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')

const { OrganizationEmployee } = require('../utils/testSchema')

describe('RegisterNewOrganizationService', () => {
    test('registerNewOrganization() by user', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        const client = await makeLoggedInClient(userAttrs)

        const name = faker.company.companyName()
        const [org] = await registerNewOrganization(client, { name })

        expect(org.id).toMatch(/^[0-9a-zA-Z-_]+$/)
        expect(org).toEqual(expect.objectContaining({
            name,
        }))

        // Validate Employee and Role!
        const employees = await OrganizationEmployee.getAll(admin, { organization: { id: org.id } })
        expect(employees).toEqual([
            expect.objectContaining({
                user: expect.objectContaining({
                    id: user.id,
                }),
                organization: expect.objectContaining({
                    id: org.id,
                    name,
                }),
                name: user.name,
                email: userAttrs.email,
                phone: userAttrs.phone,
                isAccepted: true,
                isRejected: false,
                role: expect.objectContaining({
                    canManageOrganization: true,
                    canManageEmployees: true,
                    canManageRoles: true,
                    canManageProperties: true,
                    canManageTickets: true,
                }),
            }),
        ])
    })
})