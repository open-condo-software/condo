const faker = require('faker')
const _ = require('lodash')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { getRandomString } = require('@core/keystone/test.utils')
const { createTestOrganizationEmployeeRole, OrganizationEmployee, OrganizationEmployeeRole } = require('../utils/testSchema')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { makeClientWithRegisteredOrganization } = require('../../../utils/testSchema/Organization')

describe('OrganizationEmployeeRole', () => {
    describe('canManageEmployees', () => {
        test('user: no access to update employee without granted `canManageEmployees`', async () => {
            const organizationAdminClient = await makeClientWithRegisteredOrganization()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const adminClient = await makeLoggedInAdminClient()

            const [role] = await createTestOrganizationEmployeeRole(adminClient, {
                name: 'Role1',
                canManageEmployees: false,
                organization: { connect: { id: organizationAdminClient.organization.id } },
            })

            const { data: { obj: employee } } = await OrganizationEmployee.create(adminClient, {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
                role: { connect: { id: role.id } },
                user: { connect: { id: userClient.user.id } },
                organization: { connect: { id: organizationAdminClient.organization.id } },
            }, { raw: true })

            const attrs = {
                dv: 1,
                name: faker.name.firstName(),
                sender: { dv: 1, fingerprint: getRandomString() },
            }
            const result = await OrganizationEmployee.update(userClient, employee.id, attrs, { raw: true })
            expect(result.errors[0]).toMatchObject({
                'data': { 'target': 'updateOrganizationEmployee', 'type': 'mutation' },
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': ['obj'],
            })
        })

        test('user: has access to update employee with granted `canManageEmployees`', async () => {
            // This will create organization with first employee and default admin role, than `can…` everything.
            // See `registerNewOrganization` mutation resolver
            const organizationAdminClient = await makeClientWithRegisteredOrganization()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const adminClient = await makeLoggedInAdminClient()

            const [role] = await createTestOrganizationEmployeeRole(adminClient, {
                name: 'Role1',
                canManageEmployees: true,
                organization: { connect: { id: organizationAdminClient.organization.id } },
            })

            const { data: { obj: employee } } = await OrganizationEmployee.create(adminClient, {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
                role: { connect: { id: role.id } },
                user: { connect: { id: userClient.user.id } },
                organization: { connect: { id: organizationAdminClient.organization.id } },
            }, { raw: true })

            const attrs = {
                dv: 1,
                name: faker.name.firstName(),
                sender: { dv: 1, fingerprint: getRandomString() },
            }
            const result = await OrganizationEmployee.update(userClient, employee.id, attrs, { raw: true })
            expect(result.errors).toBeUndefined()
            expect(result.data.obj).toMatchObject(attrs)
        })
    })

    describe('canManageRoles', () => {
        test('user: no access to create role without granted `canManageRoles`', async () => {
            const organizationAdminClient = await makeClientWithRegisteredOrganization()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const adminClient = await makeLoggedInAdminClient()

            const [role] = await createTestOrganizationEmployeeRole(adminClient, {
                name: 'Role1',
                canManageRoles: false,
                organization: { connect: { id: organizationAdminClient.organization.id } },
            })

            const { data: { obj: employee } } = await OrganizationEmployee.create(adminClient, {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
                role: { connect: { id: role.id } },
                user: { connect: { id: userClient.user.id } },
                organization: { connect: { id: organizationAdminClient.organization.id } },
            }, { raw: true })

            const attrs = {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: 'Role2',
                organization: { connect: { id: organizationAdminClient.organization.id } },
            }

            const { errors } = await OrganizationEmployeeRole.create(userClient, attrs, { raw: true })
            expect(errors[0]).toMatchObject({
                'data': { 'target': 'createOrganizationEmployeeRole', 'type': 'mutation' },
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': ['obj'],
            })
        })

        test('user: can create role when granted `canManageRoles`', async () => {
            const organizationAdminClient = await makeClientWithRegisteredOrganization()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const adminClient = await makeLoggedInAdminClient()

            const [role] = await createTestOrganizationEmployeeRole(adminClient, {
                name: 'Role1',
                canManageRoles: true,
                organization: { connect: { id: organizationAdminClient.organization.id } },
            })

            const { data: { obj: employee } } = await OrganizationEmployee.create(adminClient, {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
                role: { connect: { id: role.id } },
                user: { connect: { id: userClient.user.id } },
                organization: { connect: { id: organizationAdminClient.organization.id } },
            }, { raw: true })

            expect(employee).toBeDefined()

            const attrs = {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: 'Role2',
                organization: { connect: { id: organizationAdminClient.organization.id } },
            }

            const { data, errors } = await OrganizationEmployeeRole.create(userClient, attrs, { raw: true })
            expect(data.obj).toMatchObject(_.omit(attrs, 'organization'))
            expect(errors).toBeUndefined()
        })
    })
})