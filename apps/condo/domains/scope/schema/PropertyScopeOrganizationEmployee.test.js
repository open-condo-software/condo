/**
 * Generated by `createschema scope.PropertyScopeOrganizationEmployee 'propertyScope:Relationship:PropertyScope:CASCADE; employee:Relationship:OrganizationEmployee:CASCADE;'`
 */

const {
    makeLoggedInAdminClient,
    makeClient,
    UUID_RE,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')


const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee, updateTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { PropertyScopeOrganizationEmployee, createTestPropertyScopeOrganizationEmployee, updateTestPropertyScopeOrganizationEmployee, createTestPropertyScope } = require('@condo/domains/scope/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

describe('PropertyScopeOrganizationEmployee', () => {
    describe('accesses', () => {
        describe('admin', () => {
            it('can create PropertyScopeOrganizationEmployee', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [propertyScope] = await createTestPropertyScope(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)
                const [propertyScopeOrganizationEmployee] = await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employee)

                expect(propertyScopeOrganizationEmployee.id).toMatch(UUID_RE)
            })

            it('can update PropertyScopeOrganizationEmployee', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [propertyScope] = await createTestPropertyScope(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)
                const [propertyScopeOrganizationEmployee] = await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employee)

                const [updatedPropertyScopeOrganizationEmployee] = await updateTestPropertyScopeOrganizationEmployee(admin, propertyScopeOrganizationEmployee.id, {})

                expect(updatedPropertyScopeOrganizationEmployee.id).toEqual(propertyScopeOrganizationEmployee.id)
            })
        })

        describe('employee', () => {
            it('employee with canManagePropertyScopes ability: can create PropertyScopeOrganizationEmployee with employee and propertyScope from his organization', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                    canManagePropertyScopes: true,
                })
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)

                const [propertyScope] = await createTestPropertyScope(user, organization)
                const [propertyScopeOrganizationEmployee] = await createTestPropertyScopeOrganizationEmployee(user, propertyScope, employee)

                expect(propertyScopeOrganizationEmployee.id).toMatch(UUID_RE)
            })

            it('employee with canManagePropertyScopes ability: cannot create PropertyScopeOrganizationEmployee with propertyScope from in not his organization', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [organization1] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                    canManagePropertyScopes: true,
                })
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)
                const [propertyScope] = await createTestPropertyScope(admin, organization1)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestPropertyScopeOrganizationEmployee(user, propertyScope, employee)
                })
            })

            it('employee without canManagePropertyScopes ability: cannot create PropertyScopeOrganizationEmployee', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)
                const [propertyScope] = await createTestPropertyScope(admin, organization)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestPropertyScopeOrganizationEmployee(user, propertyScope, employee)
                })
            })

            it('employee with canManagePropertyScopes ability: can soft delete PropertyScopeOrganizationEmployee in his organization', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                    canManagePropertyScopes: true,
                })
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)

                const [propertyScope] = await createTestPropertyScope(user, organization)
                const [propertyScopeEmployee] = await createTestPropertyScopeOrganizationEmployee(user, propertyScope, employee)

                const [updatedPropertyScopeEmployee] = await updateTestPropertyScopeOrganizationEmployee(user, propertyScopeEmployee.id, {
                    deletedAt: 'true',
                })

                expect(updatedPropertyScopeEmployee.id).toEqual(propertyScopeEmployee.id)
                expect(updatedPropertyScopeEmployee.deletedAt).toBeDefined()
            })

            it('employee with canManagePropertyScopes ability: cannot soft delete PropertyScopeOrganizationEmployee in not his organization', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()
                const user1 = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                    canManagePropertyScopes: true,
                })
                await createTestOrganizationEmployee(admin, organization, user.user, role)

                const [organization1] = await createTestOrganization(admin)
                const [role1] = await createTestOrganizationEmployeeRole(admin, organization1, {
                    canManagePropertyScopes: true,
                })
                const [employee1] = await createTestOrganizationEmployee(admin, organization1, user1.user, role1)
                const [propertyScope] = await createTestPropertyScope(admin, organization1)
                const [propertyScopeEmployee] = await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employee1)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestPropertyScopeOrganizationEmployee(user, propertyScopeEmployee.id, {
                        deletedAt: 'true',
                    })
                })
            })

            it('employee with canManagePropertyScopes ability: cannot update PropertyScopeOrganizationEmployee in his organization if its not soft delete operation', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                    canManagePropertyScopes: true,
                })
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)

                const [propertyScope] = await createTestPropertyScope(user, organization)
                const [propertyScope1] = await createTestPropertyScope(user, organization)
                const [propertyScopeEmployee] = await createTestPropertyScopeOrganizationEmployee(user, propertyScope, employee)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestPropertyScopeOrganizationEmployee(user, propertyScopeEmployee.id, {
                        propertyScope: { connect: { id: propertyScope1.id } },
                    })
                })
            })

            it('employee without canManagePropertyScopes ability: cannot update PropertyScopeOrganizationEmployee', async () => {
                const admin = await makeLoggedInAdminClient()
                const user = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                const [employee] = await createTestOrganizationEmployee(admin, organization, user.user, role)
                const [propertyScope] = await createTestPropertyScope(admin, organization)
                const [propertyScopeEmployee] = await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employee)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestPropertyScopeOrganizationEmployee(user, propertyScopeEmployee.id, {
                        deletedAt: 'true',
                    })
                })
            })
        })

        describe('anonymous', () => {
            it('cannot create PropertyScopeOrganizationEmployee', async () => {
                const admin = await makeLoggedInAdminClient()
                const anonymous = await makeClient()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                const [employee] = await createTestOrganizationEmployee(admin, organization, admin.user, role)
                const [propertyScope] = await createTestPropertyScope(admin, organization)

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestPropertyScopeOrganizationEmployee(anonymous, propertyScope, employee)
                })
            })

            it('cannot update PropertyScopeOrganizationEmployee', async () => {
                const admin = await makeLoggedInAdminClient()
                const anonymous = await makeClient()

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                const [employee] = await createTestOrganizationEmployee(admin, organization, admin.user, role)
                const [propertyScope] = await createTestPropertyScope(admin, organization)
                const [propertyScopeEmployee] = await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employee)

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestPropertyScopeOrganizationEmployee(anonymous, propertyScopeEmployee.id, {})
                })
            })
        })
    })

    describe('logic', () => {
        it('delete PropertyScopeOrganizationEmployee after employee deletion', async () => {
            const admin = await makeLoggedInAdminClient()
            const user = await makeClientWithNewRegisteredAndLoggedInUser()

            const [org] = await registerNewOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, org)
            const [employee] = await createTestOrganizationEmployee(admin, org, user.user, role)
            const [propertyScope] = await createTestPropertyScope(admin, org)
            await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employee)

            await updateTestOrganizationEmployee(admin, employee.id, {
                deletedAt: 'true',
            })

            const propertyScopeOrganizationEmployees = await PropertyScopeOrganizationEmployee.getAll(admin,
                { employee: { id: employee.id }, propertyScope: { id: propertyScope.id } })

            expect(propertyScopeOrganizationEmployees).toHaveLength(0)
        })
    })
})
