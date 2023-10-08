/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, makeLoggedInAdminClient, DATETIME_RE } = require('@open-condo/keystone/test.utils')

const { OrganizationEmployee: OrganizationEmployeeApi, Organization: OrganizationApi } = require('@condo/domains/organization/utils/serverSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { UserAdmin } = require('@condo/domains/user/utils/serverSchema')
const { makeClientWithNewRegisteredAndLoggedInUser, User } = require('@condo/domains/user/utils/testSchema')

const { MockSbbolResponses } = require('./MockSbbolResponses')
const { syncOrganization } = require('./syncOrganization')
const { syncUser } = require('./syncUser')


const { keystone } = index

describe('syncOrganization from SBBOL', () => {
    setFakeClientMode(index)

    describe('Organization not exists', () => {

        it('should create new organization and make user its admin', async () => {
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(client)
            const user = await UserAdmin.getOne(adminContext, { id: client.user.id })

            userData.phone = user.phone
            organizationData.meta.inn = organization.tin

            await OrganizationApi.softDelete(adminContext, organization.id, { ...dvSenderFields })

            const [connectedEmployee] = await OrganizationEmployeeApi.getAll(adminContext, {
                user: { id: user.id },
            })
            await OrganizationEmployeeApi.softDelete(adminContext, connectedEmployee.id, { ...dvSenderFields })

            await syncOrganization({
                context,
                user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })

            const [ newOrganization ] = await OrganizationApi.getAll(adminContext, {
                importId: organizationData.importId,
                importRemoteSystem: organizationData.importRemoteSystem,
            }, { sortBy: ['createdAt_DESC'], first: 1 })
            expect(newOrganization).toBeDefined()

            const [existedEmployee] = await OrganizationEmployeeApi.getAll(adminContext, {
                organization: { id: newOrganization.id },
                user: { id: user.id },
            })
            expect(existedEmployee).toBeDefined()
            expect(existedEmployee.isAccepted).toBeTruthy()
            expect(existedEmployee.role.canManageEmployees).toBeTruthy()
            expect(existedEmployee.phone).toEqual(user.phone)
        })

        it('should create new organization and create new user', async () => {
            const identityId = faker.datatype.uuid()
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const user = await syncUser({ context, userInfo: userData, identityId })

            await syncOrganization({
                context,
                user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })

            const [ newOrganization ] = await OrganizationApi.getAll(adminContext, {
                importId: organizationData.importId,
                importRemoteSystem: organizationData.importRemoteSystem,
            })
            expect(newOrganization).toBeDefined()

            const [ existedEmployee ] = await OrganizationEmployeeApi.getAll(adminContext, {
                organization: { id: newOrganization.id },
                user: { id: user.id },
            })
            expect(existedEmployee).toBeDefined()
            expect(existedEmployee.isAccepted).toBeTruthy()
            expect(existedEmployee.role.canManageEmployees).toBeTruthy()
        })
    })

    describe('Organization already exists', () => {
        it('should update existed organization with a same tin', async () => {
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const adminClient = await makeLoggedInAdminClient()
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(client)
            const context = {
                keystone,
                context: adminContext,
            }
            const [user] = await User.getAll(adminClient, {
                id: client.user.id,
            }, { first: 1 })
            userData.phone = user.phone
            organizationData.meta.inn = organization.tin
            const { organization: updOrg, employee } = await syncOrganization({
                context,
                user: user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })
            expect(updOrg.id).toEqual(organization.id)
            expect(employee).toBeDefined()
            const [ updatedOrganization ] = await OrganizationApi.getAll(adminContext, { id: organization.id })
            expect(updatedOrganization.importId).toEqual(organizationData.importId)
            expect(updatedOrganization.importRemoteSystem).toEqual(organizationData.importRemoteSystem)
        })

        it('should make user an employee with admin role', async () => {
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const existedOrganizationClient = await makeClientWithRegisteredOrganization()
            organizationData.meta.inn = existedOrganizationClient.organization.tin
            await OrganizationApi.update(adminContext, existedOrganizationClient.organization.id, {
                importId: organizationData.importId,
                importRemoteSystem: organizationData.importRemoteSystem,
                ...dvSenderFields,
                meta: {
                    ...organizationData.meta,
                },
            })

            const newUserClient1 = await makeClientWithNewRegisteredAndLoggedInUser()
            await syncOrganization({
                context,
                user: newUserClient1.user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })

            const [ existedEmployee ] = await OrganizationEmployeeApi.getAll(adminContext, {
                organization: { id: existedOrganizationClient.organization.id },
                user: { id: newUserClient1.user.id },
            })
            expect(existedEmployee).toBeDefined()
            expect(existedEmployee.isAccepted).toBeTruthy()
            expect(existedEmployee.role.canManageEmployees).toBeTruthy()

            const newUserClient2 = await makeClientWithNewRegisteredAndLoggedInUser()

            await syncOrganization({
                context,
                user: newUserClient2.user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })

            const [ existedEmployee2 ] = await OrganizationEmployeeApi.getAll(adminContext, {
                organization: { id: existedOrganizationClient.organization.id },
                user: { id: newUserClient2.user.id },
            })
            expect(existedEmployee2).toBeDefined()
            expect(existedEmployee2.isAccepted).toBeTruthy()
            expect(existedEmployee2.role.canManageEmployees).toBeTruthy()
        })
    })

    describe('Organization is soft-deleted', () => {
        it('creates new organization', async () => {
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const userClient = await makeClientWithRegisteredOrganization()
            const existingOrganization = userClient.organization
            const existingOrganizationEmployee = await OrganizationEmployeeApi.getOne(adminContext, {
                user: { id: userClient.user.id },
                organization: { id: existingOrganization.id },
            })
            organizationData.meta.inn = userClient.organization.tin
            await OrganizationApi.update(adminContext, existingOrganization.id, {
                importId: organizationData.importId,
                importRemoteSystem: organizationData.importRemoteSystem,
                ...dvSenderFields,
                meta: {
                    ...organizationData.meta,
                },
            })
            const deletedOrganization = await OrganizationApi.softDelete(adminContext, existingOrganization.id, {
                ...dvSenderFields,
            })
            expect(deletedOrganization.deletedAt).toMatch(DATETIME_RE)

            const userClient2 = await makeClientWithNewRegisteredAndLoggedInUser()
            const { employee, organization } = await syncOrganization({
                context,
                user: userClient2.user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })
            expect(employee.id).not.toEqual(existingOrganizationEmployee.id)
            expect(organization.id).not.toEqual(existingOrganization.id)
        })
    })
})