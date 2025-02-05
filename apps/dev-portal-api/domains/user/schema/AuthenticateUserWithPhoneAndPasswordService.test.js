const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { makeClient, expectToThrowGQLError } = require('@open-condo/keystone/test.utils')

const { AUTH_WITH_PHONE_DAILY_LIMIT_BY_IP } = require('@dev-portal-api/domains/user/constants')
const { ERRORS } = require('@dev-portal-api/domains/user/schema/AuthenticateUserWithPhoneAndPasswordService')
const {
    registerNewTestUser,
    authenticateUserWithPhoneAndPasswordByTestClient,
    createTestPhone,
    makeLoggedInAdminClient,
    updateTestUser,
} = require('@dev-portal-api/domains/user/utils/testSchema')

describe('AuthenticateUserWithPhoneAndPasswordService', () => {
    let registeredUser
    beforeAll(async () => {
        const [user, userAttrs] = await registerNewTestUser({})
        registeredUser = userAttrs
        registeredUser.id = user.id
    })
    test('Basic authorization must work', async () => {
        const client = await makeClient()
        const [result] = await authenticateUserWithPhoneAndPasswordByTestClient(client, {
            phone: registeredUser.phone,
            password: registeredUser.password,
        })
        expect(result).toHaveProperty('token')
        expect(result).toHaveProperty(['item', 'id'], registeredUser.id)
    })
    test('Cannot authenticate for soft-deleted user', async () => {
        const [user, attrs] = await registerNewTestUser()
        const admin = await makeLoggedInAdminClient()
        const [deletedUser] = await updateTestUser(admin, user.id, {
            deletedAt: dayjs().toISOString(),
        })
        expect(deletedUser).toHaveProperty('deletedAt')
        expect(deletedUser.deletedAt).not.toBeNull()

        const client = await makeClient()
        await expectToThrowGQLError(async () => {
            await authenticateUserWithPhoneAndPasswordByTestClient(client, {
                phone: attrs.phone,
                password: attrs.password,
            })
        }, ERRORS.INCORRECT_PHONE_OR_PASSWORD, 'result')
    })
    describe('Must throw error on incorrect credentials', () => {
        test('Incorrect phone', async () => {
            const client = await makeClient()
            await expectToThrowGQLError(async () => {
                await authenticateUserWithPhoneAndPasswordByTestClient(client, {
                    phone: createTestPhone(),
                    password: registeredUser.password,
                })
            }, ERRORS.INCORRECT_PHONE_OR_PASSWORD, 'result')
        })
        test('Incorrect password', async () => {
            const client = await makeClient()
            await expectToThrowGQLError(async () => {
                await authenticateUserWithPhoneAndPasswordByTestClient(client, {
                    phone: registeredUser.phone,
                    password: faker.internet.password(),
                })
            }, ERRORS.INCORRECT_PHONE_OR_PASSWORD, 'result')
        })
    })
    test('Must be secured from brute-forcing', async () => {
        const phone = createTestPhone()
        const client = await makeClient()

        for (let i = 0; i < AUTH_WITH_PHONE_DAILY_LIMIT_BY_IP; i++) {
            await expectToThrowGQLError(async () => {
                await authenticateUserWithPhoneAndPasswordByTestClient(client, {
                    phone,
                    password: faker.internet.password(),
                })
            }, ERRORS.INCORRECT_PHONE_OR_PASSWORD, 'result')
        }

        await expectToThrowGQLError(async () => {
            await authenticateUserWithPhoneAndPasswordByTestClient(client, {
                phone,
                password: faker.internet.password(),
            })
        }, ERRORS.AUTH_ATTEMPTS_DAILY_LIMIT_REACHED, 'result')
    })
})