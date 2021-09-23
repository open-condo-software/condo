const faker = require('faker')

const { makeLoggedInClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')

const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')

const { OrganizationEmployee, OrganizationEmployeeRole } = require('../utils/testSchema')

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
                    canBeAssignedAsResponsible: true,
                    canBeAssignedAsExecutor: true,
                }),
            }),
        ])
    })

    it('creates default roles', async () => {
        const admin = await makeLoggedInAdminClient()
        const [org] = await registerNewOrganization(admin)

        const [administratorRole] = await OrganizationEmployeeRole.getAll(admin, {
            organization: { id: org.id },
            name_contains_i: 'administrator',
        })
        expect(administratorRole).toMatchObject({
            canManageOrganization: true,
            canManageEmployees: true,
            canManageRoles: true,
            canManageIntegrations: true,
            canManageProperties: true,
            canManageTickets: true,
            canManageContacts: true,
            canManageTicketComments: true,
            canManageDivisions: true,
            canManageMeters: true,
            canShareTickets: true,
            canBeAssignedAsResponsible: true,
            canBeAssignedAsExecutor: true,
        })

        const [dispatcherRole] = await OrganizationEmployeeRole.getAll(admin, {
            organization: { id: org.id },
            name_contains_i: 'dispatcher',
        })
        expect(dispatcherRole).toMatchObject({
            canManageOrganization: false,
            canManageEmployees: false,
            canManageRoles: false,
            canManageIntegrations: false,
            canManageProperties: true,
            canManageTickets: true,
            canManageContacts: true,
            canManageMeters: true,
            canManageTicketComments: true,
            canManageDivisions: false,
            canShareTickets: true,
            canBeAssignedAsResponsible: true,
            canBeAssignedAsExecutor: true,
        })

        const [managerRole] = await OrganizationEmployeeRole.getAll(admin, {
            organization: { id: org.id },
            name_contains_i: 'manager',
        })
        expect(managerRole).toMatchObject({
            canManageOrganization: false,
            canManageEmployees: false,
            canManageRoles: false,
            canManageIntegrations: false,
            canManageProperties: true,
            canManageTickets: true,
            canManageContacts: true,
            canManageTicketComments: true,
            canManageDivisions: false,
            canManageMeters: true,
            canShareTickets: true,
            canBeAssignedAsResponsible: true,
            canBeAssignedAsExecutor: true,
        })

        const [foremanRole] = await OrganizationEmployeeRole.getAll(admin, {
            organization: { id: org.id },
            name_contains_i: 'foreman',
        })
        expect(foremanRole).toMatchObject({
            canManageOrganization: false,
            canManageEmployees: false,
            canManageRoles: false,
            canManageIntegrations: false,
            canManageProperties: false,
            canManageTickets: true,
            canManageContacts: false,
            canManageTicketComments: true,
            canManageDivisions: false,
            canManageMeters: true,
            canShareTickets: true,
            canBeAssignedAsResponsible: true,
            canBeAssignedAsExecutor: true,
        })

        const [technicianRole] = await OrganizationEmployeeRole.getAll(admin, {
            organization: { id: org.id },
            name_contains_i: 'technician',
        })
        expect(technicianRole).toMatchObject({
            canManageOrganization: false,
            canManageEmployees: false,
            canManageRoles: false,
            canManageIntegrations: false,
            canManageProperties: false,
            canManageTickets: true,
            canManageContacts: false,
            canManageTicketComments: true,
            canManageDivisions: false,
            canManageMeters: false,
            canShareTickets: true,
            canBeAssignedAsResponsible: true,
            canBeAssignedAsExecutor: true,
        })
    })
})