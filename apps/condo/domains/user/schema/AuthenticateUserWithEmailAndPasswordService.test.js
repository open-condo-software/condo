const { faker } = require('@faker-js/faker')

const {
    makeClient,
    makeLoggedInAdminClient,
    expectToThrowGQLErrorToResult,
} = require('@open-condo/keystone/test.utils')

const { STAFF, SERVICE } = require('@condo/domains/user/constants/common')
const { SIGNIN_BY_EMAIL_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
const {
    createTestUser,
    User,
    createTestEmail,
    authenticateUserWithEmailAndPasswordByTestClient,
} = require('@condo/domains/user/utils/testSchema')

describe('AuthenticateUserWithEmailAndPasswordService', () => {
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Accesses', () => {
        test('Anonymous (anyone)', async () => {
            const [user, userAttrs] = await createTestUser(admin, { type: STAFF })
            const client = await makeClient()
            const [res] = await authenticateUserWithEmailAndPasswordByTestClient(client, {
                email: userAttrs.email,
                password: userAttrs.password,
                userType: STAFF,
            })
            expect(res.item.id).toBe(user.id)
            expect(res.token).not.toBeNull()
        })
    })

    describe('Basic logic', () => {
        test.each([STAFF, SERVICE])('Successful authentication for %p user', async (userType) => {
            const [user, userAttrs] = await createTestUser(admin, { type: userType })
            const client = await makeClient()
            const [res] = await authenticateUserWithEmailAndPasswordByTestClient(client, {
                email: userAttrs.email,
                password: userAttrs.password,
                userType,
            })
            expect(res.item.id).toBe(user.id)
            expect(res.token).not.toBeNull()
        })

        test('Wrong email format', async () => {
            const client = await makeClient()
            await expectToThrowGQLErrorToResult(async () => {
                await authenticateUserWithEmailAndPasswordByTestClient(client, {
                    email: 'invalid-email',
                    password: 'password',
                    userType: STAFF,
                })
            }, {
                mutation: 'authenticateUserWithEmailAndPassword',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_EMAIL_FORMAT',
            })
        })

        test('Wrong credentials', async () => {
            const [, userAttrs] = await createTestUser(admin, { type: STAFF })
            const client = await makeClient()
            await expectToThrowGQLErrorToResult(async () => {
                await authenticateUserWithEmailAndPasswordByTestClient(client, {
                    email: userAttrs.email,
                    password: 'wrong-password',
                    userType: STAFF,
                })
            }, {
                mutation: 'authenticateUserWithEmailAndPassword',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_CREDENTIALS',
            })
        })

        test('User is soft-deleted', async () => {
            const [user, userAttrs] = await createTestUser(admin, { type: STAFF })
            await User.softDelete(admin, user.id)
            const client = await makeClient()
            await expectToThrowGQLErrorToResult(async () => {
                await authenticateUserWithEmailAndPasswordByTestClient(client, {
                    email: userAttrs.email,
                    password: userAttrs.password,
                    userType: STAFF,
                })
            }, {
                mutation: 'authenticateUserWithEmailAndPassword',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_CREDENTIALS',
            })
        })
    })

    describe('Guards', () => {
        const GUARD_WINDOW_LIMIT = 10

        test('Rate limit by IP', async () => {
            const client = await makeClient()
            const fakeIp = faker.internet.ip()
            client.setHeaders({ 'x-forwarded-for': fakeIp })

            for (let i = 0; i <= GUARD_WINDOW_LIMIT; i++) {
                const email = createTestEmail()
                const password = faker.datatype.string(42)
                const { errors } = await client.mutate(SIGNIN_BY_EMAIL_AND_PASSWORD_MUTATION, { data: { email, password } })

                expect(errors).toHaveLength(1)
                if (i < GUARD_WINDOW_LIMIT) {
                    expect(errors[0].extensions.type).toBe('WRONG_CREDENTIALS')
                } else {
                    expect(errors[0].extensions.type).toBe('TOO_MANY_REQUESTS')
                }
         
            }
        })
    })
})