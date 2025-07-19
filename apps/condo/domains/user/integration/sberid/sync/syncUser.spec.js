/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { SBER_ID_IDP_TYPE, RESIDENT } = require('@condo/domains/user/constants/common')
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
    phoneNumber: phone || faker.phone.number('+792########'),
})

describe('syncUser from SberId', () => {
    let context
    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
    })

    it('should create user', async () => {
        const identityId = faker.datatype.uuid()
        const userInfo = mockUserInfo(identityId)

        // act
        const { id } = await syncUser({ context, userInfo, userType: RESIDENT })

        // assertions
        // assert created user
        expect(id).toBeDefined()
        const [ checkUser ] = await User.getAll(context,
            { id },
            'id name email phone type isPhoneVerified isEmailVerified'
        )
        expect(checkUser).toBeDefined()
        expect(checkUser).toHaveProperty('id')
        expect(checkUser).toHaveProperty('name')
        expect(checkUser).toHaveProperty('email')
        expect(checkUser).toHaveProperty('phone')
        expect(checkUser.type).toEqual(RESIDENT)
        expect(checkUser.isPhoneVerified).toBeTruthy()
        expect(checkUser.isEmailVerified).toBeTruthy()

        // assert user external identity
        const [ checkedIdentity ] = await UserExternalIdentityApi.getAll(context, {
            identityId,
            identityType: SBER_ID_IDP_TYPE,
        }, 'id user { id } identityId identityType')
        expect(checkedIdentity).toBeDefined()
        expect(checkedIdentity).toHaveProperty('user')
        expect(checkedIdentity.user.id).toEqual(checkUser.id)
        expect(checkedIdentity.identityId).toEqual(identityId)
        expect(checkedIdentity.identityType).toEqual(SBER_ID_IDP_TYPE)
    })

    it('should create user external identity', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        // act
        const { id } = await syncUser({ context, userInfo, userType: existingUser.type })

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)

        // assert user external identity
        const [ checkedIdentity ] = await UserExternalIdentityApi.getAll(context, {
            identityId,
            identityType: SBER_ID_IDP_TYPE,
        }, 'user { id } identityId identityType')
        expect(checkedIdentity).toBeDefined()
        expect(checkedIdentity).toHaveProperty('user')
        expect(checkedIdentity.user.id).toEqual(id)
        expect(checkedIdentity.identityId).toEqual(identityId)
        expect(checkedIdentity.identityType).toEqual(SBER_ID_IDP_TYPE)
    })

    it('should return user id', async () => {
        const identityId = faker.datatype.uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUser.id } },
            identityId: userInfo.id,
            identityType: SBER_ID_IDP_TYPE,
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
            identityType: SBER_ID_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })
})