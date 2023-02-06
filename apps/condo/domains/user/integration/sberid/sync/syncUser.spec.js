/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { getItems } = require('@keystonejs/server-side-graphql-client')
const faker = require('faker')
const { v4: uuid } = require('uuid')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { SBER_ID_IDP_TYPE, RESIDENT } = require('@condo/domains/user/constants/common')
const {
    UserExternalIdentity: UserExternalIdentityApi,
} = require('@condo/domains/user/utils/serverSchema')

const { syncUser } = require('./syncUser')

const { keystone } = index

const mockUserInfo = (identityId, phone) => ({
    id: identityId,
    issuer: 'testIssuer',
    email: faker.internet.email(),
    phoneNumber: phone || faker.phone.phoneNumber('+792########'),
})

describe('syncUser from SBBOL', () => {
    setFakeClientMode(index)

    it('should create user', async () => {
        // assemble
        const identityId = uuid()
        const userInfo = mockUserInfo(identityId)
        const context = await keystone.createContext({ skipAccessControl: true })

        // act
        const { id } = await syncUser({ context, userInfo, userType: RESIDENT })

        // assertions
        // assert created user
        expect(id).toBeDefined()
        const [ checkUser ] = await getItems({
            keystone,
            listKey: 'User',
            where: { id },
            returnFields: 'id name email phone type isPhoneVerified isEmailVerified',
        })
        expect(checkUser).toBeDefined()
        expect(checkUser.id).toBeDefined()
        expect(checkUser.name).toBeDefined()
        expect(checkUser.email).toBeDefined()
        expect(checkUser.phone).toBeDefined()
        expect(checkUser.type).toEqual(RESIDENT)
        expect(checkUser.isPhoneVerified).toBeTruthy()
        expect(checkUser.isEmailVerified).toBeTruthy()

        // assert user external identity
        const [ checkedIdentity ] = await UserExternalIdentityApi.getAll(context, {
            identityId,
            identityType: SBER_ID_IDP_TYPE,
        })
        expect(checkedIdentity).toBeDefined()
        expect(checkedIdentity.user).toBeDefined()
        expect(checkedIdentity.user.id).toEqual(checkUser.id)
        expect(checkedIdentity.identityId).toEqual(identityId)
        expect(checkedIdentity.identityType).toEqual(SBER_ID_IDP_TYPE)
    })

    it('should create user external identity', async () => {
        // assemble
        const identityId = uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)
        const context = await keystone.createContext({ skipAccessControl: true })

        // act
        const { id } = await syncUser({ context, userInfo, userType: existingUser.type })

        // assertions
        // assert id of user
        expect(id).toEqual(existingUser.id)

        // assert user external identity
        const [ checkedIdentity ] = await UserExternalIdentityApi.getAll(context, {
            identityId,
            identityType: SBER_ID_IDP_TYPE,
        })
        expect(checkedIdentity).toBeDefined()
        expect(checkedIdentity.user).toBeDefined()
        expect(checkedIdentity.user.id).toEqual(id)
        expect(checkedIdentity.identityId).toEqual(identityId)
        expect(checkedIdentity.identityType).toEqual(SBER_ID_IDP_TYPE)
    })

    it('should return user id', async () => {
        // assemble
        const identityId = uuid()
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = mockUserInfo(identityId, existingUserPhone)
        const context = await keystone.createContext({ skipAccessControl: true })

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: uuid() },
            user: { connect: { id: existingUser.id } },
            identityId: userInfo.id,
            identityType: SBER_ID_IDP_TYPE,
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

        expect(identities.length).toEqual(1)
    })
})