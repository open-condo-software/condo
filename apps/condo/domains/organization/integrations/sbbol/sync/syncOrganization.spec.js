/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { getItem, updateItem } = require('@keystonejs/server-side-graphql-client')
const faker = require('faker')
const { v4: uuid } = require('uuid')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { OrganizationEmployee: OrganizationEmployeeApi, Organization: OrganizationApi } = require('@condo/domains/organization/utils/serverSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { MockSbbolResponses } = require('./MockSbbolResponses')
const { syncOrganization } = require('./syncOrganization')
const { syncUser } = require('./syncUser')

const { keystone } = index

describe('syncOrganization from SBBOL', () => {
    setFakeClientMode(index)

    describe('Organization not exists', () => {

        it('should update existed organization with a same tin', async () => {
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const client = await makeClientWithRegisteredOrganization()
            const context = {
                keystone,
                context: adminContext,
            }
            const user = await getItem({
                keystone,
                itemId: client.user.id,
                listKey: 'User',
                returnFields: 'id name phone',
            })
            userData.phone = user.phone
            organizationData.meta.inn = client.organization.tin
            await syncOrganization({
                context,
                user: user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })
            const [ updatedOrganization ] = await OrganizationApi.getAll(adminContext, { id: client.organization.id })
            expect(updatedOrganization.importId).toEqual(organizationData.importId)
            expect(updatedOrganization.importRemoteSystem).toEqual(organizationData.importRemoteSystem)
        })

        it('should create new organization and make user its admin', async () => {
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const user = await getItem({
                keystone,
                itemId: client.user.id,
                listKey: 'User',
                returnFields: 'id name phone',
            })
            userData.phone = user.phone
            await syncOrganization({
                context,
                user: user,
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

        it('should create new organization and create new user', async () => {
            const identityId = uuid()
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
        it('should make user an employee with admin role', async () => {
            const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const existedOrganizationClient = await makeClientWithRegisteredOrganization()
            await updateItem({
                keystone,
                context: adminContext,
                listKey: 'Organization',
                item: {
                    id: existedOrganizationClient.organization.id,
                    data: {
                        importId: organizationData.importId,
                        importRemoteSystem: organizationData.importRemoteSystem,
                        ...dvSenderFields,
                    },
                },
            })
            const newUserClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const user = await getItem({
                keystone,
                itemId: newUserClient.user.id,
                listKey: 'User',
                returnFields: 'id name phone',
            })
            await syncOrganization({
                context,
                user,
                userData,
                dvSenderFields,
                organizationInfo: organizationData,
            })
            const [ existedEmployee ] = await OrganizationEmployeeApi.getAll(adminContext, {
                organization: { id: existedOrganizationClient.organization.id },
                user: { id: user.id },
            })
            expect(existedEmployee).toBeDefined()
            expect(existedEmployee.isAccepted).toBeTruthy()
            expect(existedEmployee.role.canManageEmployees).toBeTruthy()

            const newUserClient2 = await makeClientWithNewRegisteredAndLoggedInUser()
            const user2 = await getItem({
                keystone,
                itemId: newUserClient2.user.id,
                listKey: 'User',
                returnFields: 'id name phone',
            })
            const userData2 = {
                ...userData,
                importId: faker.datatype.uuid(),
                email: faker.internet.email(),
                phone: faker.phone.phoneNumber('+79#########'),
            }
            await syncOrganization({
                context,
                user: user2,
                userData: userData2,
                dvSenderFields,
                organizationInfo: organizationData,
            })
            const [ existedEmployee2 ] = await OrganizationEmployeeApi.getAll(adminContext, {
                organization: { id: existedOrganizationClient.organization.id },
                user: { id: user2.id },
            })
            expect(existedEmployee2).toBeDefined()
            expect(existedEmployee2.isAccepted).toBeTruthy()
            expect(existedEmployee2.role.canManageEmployees).toBeTruthy()
        })
    })
})