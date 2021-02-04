/**
 * @jest-environment node
 */

const conf = require('@core/config')
const { setFakeClientMode } = require('@core/keystone/test.utils')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const faker = require('faker')
const { makeClient, makeLoggedInClient, createUser, getSchemaObject, createSchemaObject, makeLoggedInAdminClient, DEFAULT_TEST_USER_IDENTITY, DEFAULT_TEST_USER_SECRET, gql } = require('@core/keystone/test.utils')

const { ForgotPasswordAction } = require('../schema/User')

const SIGNIN_MUTATION = gql`
    mutation sigin($identity: String, $secret: String) {
        auth: authenticateUserWithPassword(email: $identity, password: $secret) {
            user: item {
                id
            }
        }
    }
`

const GET_MY_USERINFO = gql`
    query getUser {
        user: authenticatedUser {
            id
        }
    }
`

const REGISTER_NEW_USER_MUTATION = gql`
    mutation registerNewUser($data: RegisterNewUserInput!) {
        user: registerNewUser(data: $data) {
            id
        }
    }
`

const ALL_FORGOT_PASSWORD_ACTIONS_QUERY = gql`
    query {
        objs: allForgotPasswordActions {
            id
            user {
                id
            }
            token
        }
    }
`

const START_PASSWORD_RECOVERY_MUTATION = gql`
    mutation startPasswordRecovery($email: String!){
        status: startPasswordRecovery(email: $email)
    }
`

const CHANGE_PASSWORD_WITH_TOKEN_MUTATION = gql`
    mutation changePasswordWithToken($token: String!, $password: String!) {
        status: changePasswordWithToken(token: $token, password: $password)
    }
`

const ALL_TOKENS_FOR_USER_QUERY = gql`
    query findTokenForUser($email: String!) {
        passwordTokens: allForgotPasswordActions(where: { user: { email: $email}}) {
            id
            token
            user {
                id
            }
        }
    }
`

describe('SIGNIN', () => {
    test('anonymous: try to sign in', async () => {
        const client = await makeClient()
        const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
            'identity': DEFAULT_TEST_USER_IDENTITY,
            'secret': DEFAULT_TEST_USER_SECRET,
        })
        expect(errors).toEqual(undefined)
        expect(data.auth.user.id).toMatch(/[a-zA-Z0-9-_]+/)
    })

    test('anonymous: get user info', async () => {
        const client = await makeClient()
        const { data, errors } = await client.query(GET_MY_USERINFO)
        expect(errors).toEqual(undefined)
        expect(data).toEqual({ 'user': null })
    })

    test('get user info after sign in', async () => {
        const client = await makeLoggedInClient()
        const { data, errors } = await client.query(GET_MY_USERINFO)
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual({ id: client.user.id })
    })

    test('anonymous: wrong password', async () => {
        const client = await makeClient()
        const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
            'identity': DEFAULT_TEST_USER_IDENTITY,
            'secret': 'wrong password',
        })
        expect(data).toEqual({ 'auth': null })
        expect(JSON.stringify(errors)).toEqual(expect.stringMatching('passwordAuth:secret:mismatch'))
    })

    test('anonymous: wrong email', async () => {
        const client = await makeClient()
        const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
            'identity': 'some3571592131usermail@example.com',
            'secret': 'wrong password',
        })
        expect(data).toEqual({ 'auth': null })
        expect(JSON.stringify(errors)).toEqual(expect.stringMatching('passwordAuth:identity:notFound'))
    })

    test('check auth by empty password', async () => {
        const user = await createUser({ password: '' })
        const checkAuthByEmptyPassword = async () => {
            await makeLoggedInClient({ email: user.email, password: '' })
        }
        await expect(checkAuthByEmptyPassword).rejects.toThrow(/passwordAuth:secret:notSet/)
    })
})

describe('REGISTER', () => {
    test('register new user', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.internet.password()
        const email = faker.internet.exampleEmail()
        const { data, errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, { data: { name, password, email } })
        expect(errors).toEqual(undefined)
        expect(data.user.id).toMatch(/^[0-9a-zA-Z-_]+$/)
    })

    test('register user with existed email', async () => {
        const user = await createUser()
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.internet.password()
        const email = user.email
        const { errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, { data: { name, password, email } })
        expect(JSON.stringify(errors)).toMatch(/register:email:multipleFound/)
    })
})

describe('FORGOT_RECOVERY_CHANGE_PASSWORD', () => {
    test('anonymous: get all ForgotPasswordActions', async () => {
        const client = await makeClient()
        const { data, errors } = await client.query(ALL_FORGOT_PASSWORD_ACTIONS_QUERY)
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allForgotPasswordActions', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ objs: null })
    })

    test('user: get all ForgotPasswordActions', async () => {
        const user = await createUser()
        const client = await makeLoggedInClient(user)
        const { data, errors } = await client.query(ALL_FORGOT_PASSWORD_ACTIONS_QUERY)
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allForgotPasswordActions', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ objs: null })
    })

    test('reset forgotten password', async () => {
        const user = await createUser()
        const client = await makeClient()
        const adm = await makeLoggedInAdminClient()
        const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: user.email })
        expect(res1.errors).toEqual(undefined)
        expect(res1.data).toEqual({ status: 'ok' })

        // get created token
        const { data: { passwordTokens } } = await adm.query(ALL_TOKENS_FOR_USER_QUERY, { email: user.email })
        expect(passwordTokens).toHaveLength(1)
        const token = passwordTokens[0].token
        expect(token).toMatch(/^[a-zA-Z0-9-]{7,40}$/g)

        // change password
        const password = `${user.password}:${user.password}:new`
        const res2 = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { token, password })
        expect(res2.errors).toEqual(undefined)
        expect(res2.data).toEqual({ status: 'ok' })

        // check logging by new password
        const newClient = await makeLoggedInClient({ email: user.email, password })
        expect(newClient.user.id).toEqual(user.id)
    })

    test('start recovery for unknown email', async () => {
        const client = await makeClient()
        const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: 'random231314@emample.com' })
        expect(JSON.stringify(res1.errors)).toEqual(expect.stringMatching('unknown-user'))
    })

    test('change password to empty', async () => {
        const { id } = await createSchemaObject(ForgotPasswordAction)
        const obj = await getSchemaObject(ForgotPasswordAction, ['token'], { id })
        const client = await makeClient()
        const res1 = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, {
            token: obj.token, password: '',
        })
        expect(res1.data).toEqual({ status: 'ok' })
    })
})