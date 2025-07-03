/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { TELEGRAM_IDP_TYPE, RESIDENT } = require('@condo/domains/user/constants/common')
const { ERROR_MESSAGES } = require('@condo/domains/user/integration/telegram/utils/errors')
const {
    UserExternalIdentity: UserExternalIdentityApi,
} = require('@condo/domains/user/utils/serverSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

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

    it('can\'t create user', async () => {
        const identityId = faker.datatype.uuid()
        const userInfo = mockUserInfo(identityId)


        const result = await syncUser({ authenticatedUser: null, context, userInfo, userType: RESIDENT })
        expect(result.error).toEqual('USER_IS_NOT_REGISTERED')
        expect(result.id).toEqual('')

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

        const noAuthenticatedUserResult = await syncUser({ authenticatedUser: null, context, userInfo, userType: existingUser.type })
        expect(noAuthenticatedUserResult.error).toEqual('USER_IS_NOT_REGISTERED')
        expect(noAuthenticatedUserResult.id).toEqual('')

        // act
        const { id, error } = await syncUser({ authenticatedUser: existingUser, context, userInfo, userType: existingUser.type })
        expect(error).not.toBeDefined()

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
            identityId: userInfo.id,
            identityType: TELEGRAM_IDP_TYPE,
            meta: userInfo,
        })

        // act
        const { id } = await syncUser({ authenticatedUser: existingUser, context, userInfo, userType: existingUser.type })
        const { id: idForAnotherUser, error } = await syncUser({ authenticatedUser: anotherNotConnectedUser, context, userInfo, userType: existingUser.type })

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)
        expect(idForAnotherUser).toEqual('')
        expect(error).toEqual(ERROR_MESSAGES.ACCESS_DENIED)

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id },
            identityType: TELEGRAM_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })
})