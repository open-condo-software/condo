const { faker } = require('@faker-js/faker')

const { makeLoggedInClient, makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const { expectToThrowAuthenticationErrorToObj } = require('@open-condo/keystone/test.utils')

const { MANAGING_COMPANY_TYPE, ORGANIZATION_TYPES } = require('@condo/domains/organization/constants/common')
const { DEFAULT_ROLES } = require('@condo/domains/organization/constants/common.js')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { TicketOrganizationSetting } = require('@condo/domains/ticket/utils/testSchema')
const { createTestUser, makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { OrganizationEmployee, OrganizationEmployeeRole } = require('../utils/testSchema')



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

            const name = faker.company.name()
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

            const name = faker.company.name()
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

            const [contractorRole] = await OrganizationEmployeeRole.getAll(admin, {
                organization: { id: org.id },
                name_contains_i: 'contractor',
            })
            expect(contractorRole).toMatchObject(getPermissions('Contractor'))
        })

        test('creates ticket organization setting', async () => {
            const admin = await makeLoggedInAdminClient()
            const [organization] = await registerNewOrganization(admin)

            const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                organization: { id: organization.id },
            })

            expect(setting.organization.id).toEqual(organization.id)
        })
    })

    describe('called by Anonymous', () => {
        it('throws Authentication error', async () => {
            const anonymousClient = await makeClient()
            const name = faker.company.name()

            await expectToThrowAuthenticationErrorToObj(async () => {
                await registerNewOrganization(anonymousClient, { name })
            })
        })
    })
    describe('Organization types', () => {
        let user
        beforeAll(async () => {
            user = await makeClientWithNewRegisteredAndLoggedInUser()
        })
        test(`Register organization with "${MANAGING_COMPANY_TYPE}" by default`, async () => {
            const [org] = await registerNewOrganization(user)
            expect(org).toHaveProperty('type', MANAGING_COMPANY_TYPE)
        })
        describe('Can specify organization type explicitly', () => {
            test.each(ORGANIZATION_TYPES)('%p', async (type) => {
                const [org] = await registerNewOrganization(user, { type })
                expect(org).toHaveProperty('type', type)
            })
        })
    })
})