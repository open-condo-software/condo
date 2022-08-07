const faker = require('faker')

const { makeLoggedInClient, makeLoggedInAdminClient, makeClient } = require('@condo/keystone/test.utils')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')

const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')

const { OrganizationEmployee, OrganizationEmployeeRole } = require('../utils/testSchema')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/testSchema')

const { DEFAULT_ROLES } = require('@condo/domains/organization/constants/common.js')
const { expectToThrowAuthenticationErrorToObj } = require('@condo/domains/common/utils/testSchema')

const EXCLUDE_CHECK_FIELDS = ['name', 'description']

const getPermissions = (roleName) => Object.fromEntries(
    Object.entries(DEFAULT_ROLES[roleName])
        .filter(
            ([key]) => !EXCLUDE_CHECK_FIELDS.includes(key)
        )
)


describe('RegisterNewOrganizationService', () => {
    describe('called by User', () => {
        it('creates new Organization', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const name = faker.company.companyName()
            const [org] = await registerNewOrganization(client, { name })

            expect(org.id).toMatch(/^[0-9a-zA-Z-_]+$/)
            expect(org).toEqual(expect.objectContaining({
                name,
            }))
        })

        it('creates new OrganizationEmployee and connects it to Organization', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const name = faker.company.companyName()
            const [org] = await registerNewOrganization(client, { name })

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
            expect(administratorRole).toMatchObject(getPermissions('Administrator'))

            const [dispatcherRole] = await OrganizationEmployeeRole.getAll(admin, {
                organization: { id: org.id },
                name_contains_i: 'dispatcher',
            })
            expect(dispatcherRole).toMatchObject(getPermissions('Dispatcher'))

            const [managerRole] = await OrganizationEmployeeRole.getAll(admin, {
                organization: { id: org.id },
                name_contains_i: 'manager',
            })
            expect(managerRole).toMatchObject(getPermissions('Manager'))

            const [foremanRole] = await OrganizationEmployeeRole.getAll(admin, {
                organization: { id: org.id },
                name_contains_i: 'foreman',
            })
            expect(foremanRole).toMatchObject(getPermissions('Foreman'))

            const [technicianRole] = await OrganizationEmployeeRole.getAll(admin, {
                organization: { id: org.id },
                name_contains_i: 'technician',
            })
            expect(technicianRole).toMatchObject(getPermissions('Technician'))
        })

        it('creates trial subscription', async () => {
            const admin = await makeLoggedInAdminClient()
            const [organization] = await registerNewOrganization(admin)

            const [subscription] = await ServiceSubscription.getAll(admin, {
                organization: {
                    id: organization.id,
                },
            })

            expect(subscription).toBeDefined()
            expect(subscription.organization.id).toEqual(organization.id)
            expect(subscription.isTrial).toBeTruthy()
            expect(subscription.unitsCount).toBeNull()
            expect(subscription.unitPrice).toBeNull()
            expect(subscription.totalPrice).toBeNull()
            expect(subscription.startAt).toBeDefined()
            expect(subscription.finishAt).toBeDefined()
        })
    })

    describe('called by Anonymous', () => {
        it('throws Authentication error', async () => {
            const anonymousClient = await makeClient()
            const name = faker.company.companyName()

            await expectToThrowAuthenticationErrorToObj(async () => {
                await registerNewOrganization(anonymousClient, { name })
            })
        })
    })
})