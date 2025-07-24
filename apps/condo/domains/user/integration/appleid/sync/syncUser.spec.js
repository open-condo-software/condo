/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { APPLE_ID_IDP_TYPE } = require('@condo/domains/user/constants/identityProviders')
const {
    User,
    UserExternalIdentity: UserExternalIdentityApi,
} = require('@condo/domains/user/utils/serverSchema')

const { syncUser } = require('./syncUser')

const { keystone } = index

const mockUserInfo = (identityId, phone) => ({
    id: identityId,
    issuer: 'testIssuer',
    email: faker.internet.email(),
})

describe('syncUser from AppleId', () => {
    let context
    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
    })

    it('should just return user id: have user with linked identity', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUser.id } },
            identityId: userInfo.id,
            identityType: APPLE_ID_IDP_TYPE,
            userType: existingUser.type,
            meta: userInfo,
        })

        // act
        const { id } = await syncUser({ context, userInfo, userType: existingUser.type })

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id },
            identityType: APPLE_ID_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })

    it('should throw error: user already linked', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUser.id } },
            identityId: userInfo.id,
            identityType: APPLE_ID_IDP_TYPE,
            userType: existingUser.type,
            meta: userInfo,
        })

        // act & assert
        await catchErrorFrom(async () => {
            await syncUser({
                context,
                userInfo,
                userType: existingUser.type,
                authedUserId: faker.datatype.uuid(),
            })
        }, (error) => {
            expect(error.message).toEqual('AppleId already linked to another user')
        })
    })

    it('should just return user id: have authed user with linked identity', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUser.id } },
            identityId: userInfo.id,
            identityType: APPLE_ID_IDP_TYPE,
            userType: existingUser.type,
            meta: userInfo,
        })

        // act
        const { id } = await syncUser({
            context,
            userInfo,
            userType: existingUser.type,
            authedUserId: existingUser.id,
        })

        // assertions
        expect(id).toEqual(existingUser.id)

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id },
            identityType: APPLE_ID_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })

    it('should return user id: have authed user with no linked identity', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        // act
        const { id } = await syncUser({
            context,
            userInfo,
            userType: existingUser.type,
            authedUserId: existingUser.id,
        })

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id },
            identityType: APPLE_ID_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })

    it('should return nothing: have deleted user with no linked identity', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        // soft delete user
        await User.softDelete(context, existingUser.id, 'id', {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
        })

        // act
        const result = await syncUser({
            context,
            userInfo,
            userType: existingUser.type,
            authedUserId: existingUser.id,
        })

        // assertions
        expect(result).not.toBeTruthy()

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id: existingUser.id },
            identityType: APPLE_ID_IDP_TYPE,
        })

        expect(identities).toHaveLength(0)
    })

    it('should return nothing: user is not registered', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        // act
        const result = await syncUser({
            context,
            userInfo,
            userType: existingUser.type,
        })

        // assertions
        // assert id of user
        expect(result).not.toBeTruthy()

        // assert count of external identities
        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id: existingUser.id },
            identityType: APPLE_ID_IDP_TYPE,
        })

        expect(identities).toHaveLength(0)
    })
})