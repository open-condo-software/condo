const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { TELEGRAM_IDP_TYPE, RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const { ERRORS, HttpError } = require('@condo/domains/user/integration/telegram/utils/errors')
const {
    UserExternalIdentity: UserExternalIdentityApi,
} = require('@condo/domains/user/utils/serverSchema')
const { makeClientWithNewRegisteredAndLoggedInUser, makeClientWithSupportUser, updateTestUser, createTestUserRightsSet } = require('@condo/domains/user/utils/testSchema')

const { syncUser } = require('./syncUser')

const { keystone } = index

const mockUserInfo = (identityId) => ({
    id: identityId,
})

describe('syncUser from Telegram', () => {
    let context
    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
    })

    it('must not create user if identity is new', async () => {
        const identityId = faker.datatype.uuid()
        const userInfo = mockUserInfo(identityId)

        await expect(async () => 
            await syncUser({ authenticatedUser: null, context, userInfo, userType: RESIDENT })
        ).rejects.toThrow(new HttpError(ERRORS.USER_IS_NOT_REGISTERED))

        const [createdIdentity] = await UserExternalIdentityApi.getAll(context, {
            identityId,
            identityType: TELEGRAM_IDP_TYPE,
        }, 'id user { id } identityId identityType')

        expect(createdIdentity).not.toBeDefined()
    })

    it('should create user external identity if authenticatedUser provided', async () => {
        const identityId = faker.datatype.uuid()
        const { user: existingUser } = await makeClientWithNewRegisteredAndLoggedInUser()
        const userInfo = mockUserInfo(identityId)

        await expect(async () => 
            await syncUser({ authenticatedUser: null, context, userInfo, userType: existingUser.type })
        ).rejects.toThrow(new HttpError(ERRORS.USER_IS_NOT_REGISTERED))

        // act
        const { id } = await syncUser({ authenticatedUser: existingUser, context, userInfo, userType: existingUser.type })

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)

        // assert user external identity
        const [ checkedIdentity ] = await UserExternalIdentityApi.getAll(context, {
            identityId,
            identityType: TELEGRAM_IDP_TYPE,
        }, 'user { id } identityId identityType')
        expect(checkedIdentity).toBeDefined()
        expect(checkedIdentity).toHaveProperty('user')
        expect(checkedIdentity.user.id).toEqual(id)
        expect(checkedIdentity.identityId).toEqual(identityId)
        expect(checkedIdentity.identityType).toEqual(TELEGRAM_IDP_TYPE)
    })

    it('should return user id', async () => {
        const identityId = faker.datatype.uuid()
        const { user: existingUser } = await makeClientWithNewRegisteredAndLoggedInUser()
        const userInfo = mockUserInfo(identityId)

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUser.id } },
            userType: existingUser.type,
            identityId: userInfo.id,
            identityType: TELEGRAM_IDP_TYPE,
            meta: userInfo,
        })

        // act
        const { id } = await syncUser({ authenticatedUser: existingUser, context, userInfo, userType: existingUser.type })
        const { id: idWithoutAuthenticatedUser } = await syncUser({ context, userInfo, userType: existingUser.type })

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)
        expect(id).toEqual(idWithoutAuthenticatedUser)

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id },
            identityType: TELEGRAM_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })
    
    it('can\'t connect identity if it already connected to another user', async () => {
        const identityId = faker.datatype.uuid()
        const { user: existingUser } = await makeClientWithNewRegisteredAndLoggedInUser()
        const userInfo = mockUserInfo(identityId)
        const { user: anotherNotConnectedUser } = await makeClientWithNewRegisteredAndLoggedInUser()

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUser.id } },
            userType: existingUser.type,
            identityId: userInfo.id,
            identityType: TELEGRAM_IDP_TYPE,
            meta: userInfo,
        })

        // act
        const { id } = await syncUser({ authenticatedUser: existingUser, context, userInfo, userType: existingUser.type })
        await expect(async () => 
            await syncUser({ authenticatedUser: anotherNotConnectedUser, context, userInfo, userType: existingUser.type })
        ).rejects.toThrow(new HttpError(ERRORS.ACCESS_DENIED))

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id },
            identityType: TELEGRAM_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })

    describe('super users are not allowed', () => {
        const clients = {}
        beforeAll(async () => {
            clients.admin = await makeLoggedInAdminClient()
            clients.admin.user.isAdmin = true
            clients.support = await makeClientWithSupportUser()
            clients.userWithRightsSet = await makeClientWithNewRegisteredAndLoggedInUser()
            const [rightsSet] = await createTestUserRightsSet(clients.support)
            const [updatedUserWithReightsSet] = await updateTestUser(clients.support, clients.userWithRightsSet.user.id, {
                rightsSet: { connect: { id: rightsSet.id } },
            })
            clients.userWithRightsSet.user = updatedUserWithReightsSet
        })

        const testCases = [
            { 
                name: 'admin',
                getClient: () => clients.admin,
            }, {
                name: 'support',
                getClient: () => clients.support,
            }, {
                name: 'user with rights set',
                getClient: () => clients.userWithRightsSet,
            },
        ]

        test.each(testCases)('throws if $name is used', async ({ getClient }) => {
            const identityId = faker.datatype.uuid()
            const userInfo = mockUserInfo(identityId)
            const client = getClient()

            await expect(async () => 
                await syncUser({ authenticatedUser: client.user, context, userInfo, userType: client.user.type })
            ).rejects.toThrow(new HttpError(ERRORS.SUPER_USERS_NOT_ALLOWED))

        })
    })

    test('deleted authenticatedUser is not allowed', async () => {
        const support = await makeClientWithSupportUser()
        const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const [updatedUser] = await updateTestUser(support, userClient.user.id, { deletedAt: new Date().toISOString() })
        userClient.user = updatedUser
        const identityId = faker.datatype.uuid()
        const userInfo = mockUserInfo(identityId)

        await expect(async () => 
            await syncUser({ authenticatedUser: userClient.user, context, userInfo, userType: userClient.user.type })
        ).rejects.toThrow(new HttpError(ERRORS.USER_IS_NOT_REGISTERED))
    })

    test('can\'t connect identity if authenticatedUser of different user type', async () => {
        const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const identityId = faker.datatype.uuid()
        const userInfo = mockUserInfo(identityId)
        const differentUserType = userClient.user.type === STAFF ? RESIDENT : STAFF

        await expect(async () => 
            await syncUser({ authenticatedUser: userClient.user, context, userInfo, userType: differentUserType })
        ).rejects.toThrow(new HttpError(ERRORS.NOT_SUPPORTED_USER_TYPE))
    })

    test('can\'t auth with identity if authenticated user is another or have different userType', async () => {
        const admin = await makeLoggedInAdminClient()
        const existingUserClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const anotherUserClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const identityId = faker.datatype.uuid()
        const userInfo = mockUserInfo(identityId)
        const userType = existingUserClient.user.type
        

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUserClient.user.id } },
            userType: userType,
            identityId: userInfo.id,
            identityType: TELEGRAM_IDP_TYPE,
            meta: userInfo,
        })

        await expect(async () => 
            await syncUser({ authenticatedUser: anotherUserClient.user, context, userInfo, userType: userType })
        ).rejects.toThrow(new HttpError(ERRORS.ACCESS_DENIED))

        const differentUserType = existingUserClient.user.type === STAFF ? RESIDENT : STAFF
        const [updatedDifferentUserTypeUser] = await updateTestUser(admin, existingUserClient.user.id, { type: differentUserType })
        existingUserClient.user = updatedDifferentUserTypeUser

        await expect(async () => 
            await syncUser({ authenticatedUser: existingUserClient.user, context, userInfo, userType: userType })
        ).rejects.toThrow(new HttpError(ERRORS.ACCESS_DENIED))
    })
})