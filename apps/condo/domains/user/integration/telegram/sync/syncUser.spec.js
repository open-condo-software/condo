/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { TELEGRAM_IDP_TYPE, RESIDENT } = require('@condo/domains/user/constants/common')
const {
    User,
    UserExternalIdentity: UserExternalIdentityApi,
} = require('@condo/domains/user/utils/serverSchema')

const { syncUser } = require('./syncUser')

const { keystone } = index

describe('syncUser', () => {
    let context
    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
    })

    test('Should create user', async () => {
        const userInfo = {
            userId: faker.random.numeric(10),
            firstName: faker.name.firstName(),
            phoneNumber: faker.phone.number('+792########'),
        }

        const { id } = await syncUser({ context, userInfo, userType: RESIDENT })

        expect(id).toBeDefined()
        const [ checkUser ] = await User.getAll(context,
            { id },
            'id name email phone type isPhoneVerified isEmailVerified'
        )
        expect(checkUser).toBeDefined()
        expect(checkUser).toHaveProperty('id')
        expect(checkUser).toHaveProperty('name')
        expect(checkUser).toHaveProperty('phone')
        expect(checkUser.type).toEqual(RESIDENT)
        expect(checkUser.isPhoneVerified).toBeTruthy()

        const [ checkedIdentity ] = await UserExternalIdentityApi.getAll(context, {
            identityId: userInfo.userId,
            identityType: TELEGRAM_IDP_TYPE,
        }, 'id user { id } identityId identityType')
        expect(checkedIdentity).toBeDefined()
        expect(checkedIdentity).toHaveProperty('user')
        expect(checkedIdentity.user.id).toEqual(checkUser.id)
        expect(checkedIdentity.identityId).toEqual(userInfo.userId)
        expect(checkedIdentity.identityType).toEqual(TELEGRAM_IDP_TYPE)
    })

    test('Should create user external identity', async () => {
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = {
            userId: faker.random.numeric(10),
            firstName: faker.name.firstName(),
            phoneNumber: existingUserPhone,
        }

        const { id } = await syncUser({ context, userInfo, userType: existingUser.type })

        expect(id).toEqual(existingUser.id)

        const [ checkedIdentity ] = await UserExternalIdentityApi.getAll(context, {
            identityId: userInfo.userId,
            identityType: TELEGRAM_IDP_TYPE,
        }, 'user { id } identityId identityType')
        expect(checkedIdentity).toBeDefined()
        expect(checkedIdentity).toHaveProperty('user')
        expect(checkedIdentity.user.id).toEqual(id)
        expect(checkedIdentity.identityId).toEqual(userInfo.userId)
        expect(checkedIdentity.identityType).toEqual(TELEGRAM_IDP_TYPE)
    })

    test('Should return user id', async () => {
        const { userAttrs: { phone: existingUserPhone }, user: existingUser } = await makeClientWithRegisteredOrganization()
        const userInfo = {
            userId: faker.random.numeric(10),
            firstName: faker.name.firstName(),
            phoneNumber: existingUserPhone,
        }

        await UserExternalIdentityApi.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.datatype.uuid() },
            user: { connect: { id: existingUser.id } },
            identityId: userInfo.userId,
            identityType: TELEGRAM_IDP_TYPE,
            meta: userInfo,
        })

        const { id } = await syncUser({ context, userInfo, userType: existingUser.type })

        expect(id).toEqual(existingUser.id)

        const identities = await UserExternalIdentityApi.getAll(context, {
            user: { id },
            identityType: TELEGRAM_IDP_TYPE,
        })

        expect(identities).toHaveLength(1)
    })
})