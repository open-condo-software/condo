/**
 * @jest-environment node
 */

const { syncUser } = require('./syncUser')
const { prepareKeystoneExpressApp, setFakeClientMode } = require('@core/keystone/test.utils')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { MockSbbolResponses } = require('./MockSbbolResponses')
const { User: UserApi } = require('@condo/domains/user/utils/serverSchema')
const { OnBoarding: OnBoardingApi } = require('@condo/domains/onboarding/utils/serverSchema')
const { getItem, getItems } = require('@keystonejs/server-side-graphql-client')
const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

let keystone

describe('syncUser from SBBOL', () => {
    setFakeClientMode(require.resolve('../../../../../index'))

    beforeAll(async () => {
        const result = await prepareKeystoneExpressApp(require.resolve('../../../../../index'))
        keystone = result.keystone
    })

    describe('User not exists', function () {
        it('should create user', async () => {
            const { userData } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const newUser = await syncUser({ context, userInfo: userData })
            expect(newUser.name).toBeDefined()
            expect(newUser.id).toBeDefined()
            expect(newUser.phone).toBeDefined()
            const [ checkUser ] = await UserApi.getAll(adminContext, { id: newUser.id })
            expect(checkUser).toBeDefined()
        })
        it('should create onboarding', async () => {
            const { userData } = MockSbbolResponses.getUserAndOrganizationInfo()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const newUser = await syncUser({ context, userInfo: userData })
            const [ checkOnboarding ] = await OnBoardingApi.getAll(adminContext, { user: { id: newUser.id } })
            expect(checkOnboarding).toBeDefined()
        })
    })
    describe('user already existed', () => {
        it('should update importId and importRemoteSystem fields', async () => {
            const client = await makeClientWithRegisteredOrganization()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const existedUser = await getItem({
                keystone,
                itemId: client.user.id,
                listKey: 'User',
                returnFields: 'id name phone',
            })
            const { userData } = MockSbbolResponses.getUserAndOrganizationInfo()
            userData.phone = existedUser.phone
            await syncUser({ context, userInfo: userData })
            const updatedUser = await getItem({
                keystone,
                itemId: client.user.id,
                listKey: 'User',
                returnFields: 'id name phone importId importRemoteSystem',
            })
            expect(existedUser.id).toEqual(updatedUser.id)
            expect(existedUser.phone).toEqual(updatedUser.phone)
            expect(updatedUser.importId).toEqual(userData.importId)
            expect(updatedUser.importRemoteSystem).toEqual(userData.importRemoteSystem)
        })
        it('should work with resident and phone collision', async () => {
            const residentClient = await makeClientWithResidentUser()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const residentUser = await getItem({
                keystone,
                itemId: residentClient.user.id,
                listKey: 'User',
                returnFields: 'id name phone',
            })
            
            const { userData } = MockSbbolResponses.getUserAndOrganizationInfo()
            userData.phone = residentUser.phone
            await syncUser({ context, userInfo: userData })
            const existingUsers = await getItems({
                keystone,
                listKey: 'User',
                where: { phone: residentUser.phone },
                returnFields: 'id type name phone importId importRemoteSystem',
            })
            
            expect(existingUsers).toHaveLength(2)

            const resident = (existingUsers[0].type === 'staff') ? existingUsers[1] : existingUsers[0]
            const staff = (existingUsers[0].type === 'staff') ? existingUsers[0] : existingUsers[1]

            expect(resident.id).toEqual(residentUser.id)
            expect(staff.id).not.toEqual(residentUser.id)

            expect(resident.importId).toEqual(null)
            expect(resident.importRemoteSystem).toEqual(null)
            expect(staff.importId).toEqual(userData.importId)
            expect(staff.importRemoteSystem).toEqual(userData.importRemoteSystem)
        })
    })
})