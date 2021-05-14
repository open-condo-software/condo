const { GET_MY_USERINFO, SIGNIN_MUTATION } = require('@condo/domains/user/gql')
const { DEFAULT_TEST_USER_IDENTITY, DEFAULT_TEST_USER_SECRET } = require('@core/keystone/test.utils')
const { makeClient, makeLoggedInClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestUser, registerNewUser } = require('@condo/domains/user/utils/testSchema')
const { WRONG_EMAIL_ERROR, EMAIL_ALREADY_REGISTERED_ERROR } = require('@condo/domains/user/constants/errors')
const { WRONG_PASSWORD_ERROR, EMPTY_PASSWORD_ERROR } = require('@condo/domains/user/constants/errors')
const { REGISTER_NEW_USER_MUTATION } = require('@condo/domains/user/gql')

const faker = require('faker')

describe('SIGNIN', () => {
    test('anonymous: SIGNIN_MUTATION', async () => {
        const client = await makeClient()
        const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
            'identity': DEFAULT_TEST_USER_IDENTITY,
            'secret': DEFAULT_TEST_USER_SECRET,
        })
        expect(data.auth.user.id).toMatch(/[a-zA-Z0-9-_]+/)
        expect(errors).toEqual(undefined)
    })

    test('anonymous: GET_MY_USERINFO', async () => {
        const client = await makeClient()
        const { data, errors } = await client.query(GET_MY_USERINFO)
        expect(errors).toEqual(undefined)
        expect(data).toEqual({ 'user': null })
    })

    test('user: GET_MY_USERINFO', async () => {
        const client = await makeLoggedInClient()
        const { data, errors } = await client.query(GET_MY_USERINFO)
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual(expect.objectContaining({ id: client.user.id }))
    })

    test('anonymous: SIGNIN_MUTATION by wrong password', async () => {
        const client = await makeClient()
        const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
            'identity': DEFAULT_TEST_USER_IDENTITY,
            'secret': 'wrong password',
        })
        expect(data).toEqual({ 'auth': null })
        console.log()
        expect(JSON.stringify(errors)).toMatch((WRONG_PASSWORD_ERROR))
    })

    test('anonymous: SIGNIN_MUTATION by wrong email', async () => {
        const client = await makeClient()
        const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
            'identity': 'some3571592131usermail@example.com',
            'secret': 'wrong password',
        })
        expect(data).toEqual({ 'auth': null })
        expect(JSON.stringify(errors)).toMatch(WRONG_EMAIL_ERROR)
    })

    test('check auth by empty password', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin, { password: '' })
        const checkAuthByEmptyPassword = async () => {
            await makeLoggedInClient({ email: userAttrs.email, password: '' })
        }
        await expect(checkAuthByEmptyPassword).rejects.toThrow(EMPTY_PASSWORD_ERROR)
    })
})

describe('RegisterNewUserService', () => {
    test('register new user', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const [user] = await registerNewUser(client, { name })
        expect(user.id).toMatch(/^[0-9a-zA-Z-_]+$/)
        expect(user.name).toMatch(name)
    })

    test('register user with existed email', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.internet.password()
        const email = userAttrs.email
        const dv = 1
        const sender = { dv: 1, fingerprint: 'tests' }
        const { errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, {
            data: {
                dv,
                sender,
                name,
                password,
                email,
            },
        })
        expect(JSON.stringify(errors)).toMatch(EMAIL_ALREADY_REGISTERED_ERROR)
    })
})
