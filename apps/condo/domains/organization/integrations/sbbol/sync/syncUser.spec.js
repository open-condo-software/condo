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

    describe('User with given phone does not exists', function () {
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
    describe('User with given phone already existed', () => {
        it('should update importId and importRemoteSystem fields', async () => {
            const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }
            const { userData } = MockSbbolResponses.getUserAndOrganizationInfo()
            userData.phone = existingUserPhone
            await syncUser({ context, userInfo: userData })
            const updatedUser = await getItem({
                keystone,
                itemId: existingUser.id,
                listKey: 'User',
                returnFields: 'id name phone importId importRemoteSystem',
            })
            expect(updatedUser.id).toEqual(existingUser.id)
            expect(updatedUser.phone).toEqual(existingUserPhone)
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
    describe('Another first user with given email already exist', () => {
        describe('another second user with given phone does not exist', () => {
            it('should clean email of first another user and create new user with given email and phone', async () => {
                const adminContext = await keystone.createContext({ skipAccessControl: true })
                const context = {
                    keystone,
                    context: adminContext,
                }
                const { userAttrs: { email: emailOfFirstAnotherUser }, user: { id: idOfFirstAnotherUser } } = await makeClientWithRegisteredOrganization()
                const { userData } = MockSbbolResponses.getUserAndOrganizationInfo()
                userData.email = emailOfFirstAnotherUser
                const newUser = await syncUser({ context, userInfo: userData })
                expect(newUser.name).toBeDefined()
                expect(newUser.id).toBeDefined()
                expect(newUser.phone).toEqual(userData.phone)
                expect(newUser.email).toEqual(userData.email)
                const [ updatedExistingUser ] = await getItems({
                    keystone,
                    listKey: 'User',
                    where: { id: idOfFirstAnotherUser },
                    returnFields: 'id email',
                })
                expect(updatedExistingUser.email).toBeNull()
            })
        })
        describe('Another second user with given phone already exist', () => {
            it('should clean email of first another user and update another second user with info from SBBOL', async () => {
                const adminContext = await keystone.createContext({ skipAccessControl: true })
                const context = {
                    keystone,
                    context: adminContext,
                }
                const { userAttrs: { email: emailOfFirstAnotherUser }, user: { id: idOfFirstAnotherUser } } = await makeClientWithRegisteredOrganization()
                const { userAttrs: { phone: phoneOfSecondAnotherUser } } = await makeClientWithRegisteredOrganization()
                const { userData } = MockSbbolResponses.getUserAndOrganizationInfo()
                userData.email = emailOfFirstAnotherUser
                userData.phone = phoneOfSecondAnotherUser
                const syncedUser = await syncUser({ context, userInfo: userData })
                expect(syncedUser.name).toBeDefined()
                expect(syncedUser.id).toBeDefined()
                expect(syncedUser.phone).toEqual(userData.phone)
                expect(syncedUser.email).toEqual(userData.email)
                const [ updatedExistingUser ] = await getItems({
                    keystone,
                    listKey: 'User',
                    where: { id: idOfFirstAnotherUser },
                    returnFields: 'id email',
                })
                expect(updatedExistingUser.email).toBeNull()
            })
        })
    })
})