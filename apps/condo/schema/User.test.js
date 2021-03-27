const faker = require('faker')

const { getRandomString, DEFAULT_TEST_USER_IDENTITY, DEFAULT_TEST_USER_SECRET } = require('@core/keystone/test.utils')
const { makeClient, makeLoggedInClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')

const { User, UserAdmin, createTestUser, registerNewUser } = require('@condo/domains/user/utils/testSchema')
const { REGISTER_NEW_USER_MUTATION, GET_MY_USERINFO, SIGNIN_MUTATION } = require('@condo/domains/user/gql')
const { EMAIL_ALREADY_REGISTERED_ERROR } = require('../constants/errors')
const { EMPTY_PASSWORD_ERROR } = require('../constants/errors')
const { WRONG_EMAIL_ERROR } = require('../constants/errors')
const { WRONG_PASSWORD_ERROR } = require('../constants/errors')

describe('User', () => {
    test('createUser()', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin, {})
        expect(user.id).toMatch(/^[A-Za-z0-9-]+$/g)
        expect(userAttrs.email).toBeTruthy()
        expect(userAttrs.password).toBeTruthy()
    })

    test('Convert email to lower case', async () => {
        const admin = await makeLoggedInAdminClient()
        const email = 'XXX' + getRandomString() + '@example.com'
        const [user, userAttrs] = await createTestUser(admin, { email })

        const objs = await UserAdmin.getAll(admin, { id: user.id })
        expect(objs[0]).toEqual(expect.objectContaining({ email: email.toLowerCase(), id: user.id }))

        const client2 = await makeLoggedInClient({ ...userAttrs, email: email.toLowerCase() })
        expect(client2.user.id).toEqual(user.id)

        // TODO(pahaz): fix in a future (it's no OK if you can't logged in by upper case email)
        const checkAuthByUpperCaseEmail = async () => {
            await makeLoggedInClient(userAttrs)
        }
        await expect(checkAuthByUpperCaseEmail).rejects.toThrow(/passwordAuth:identity:notFound/)
    })

    test('anonymous: getAll', async () => {
        const client = await makeClient()
        const { data, errors } = await User.getAll(client, {}, { raw: true })
        expect(data).toEqual({ objs: null })
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allUsers', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
    })

    test('anonymous: count', async () => {
        const client = await makeClient()
        const { data, errors } = await User.count(client, {}, { raw: true })
        expect(data).toEqual({ meta: { count: null } })
        expect(errors[0]).toMatchObject({
            'data': { 'target': '_allUsersMeta', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['meta', 'count'],
        })
    })

    test('user: getAll', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const { data } = await UserAdmin.getAll(client, {}, { raw: true, sortBy: ['updatedAt_DESC'] })
        expect(data.objs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: user.id, email: userAttrs.email }),
                expect.objectContaining({ email: null }),
            ]),
        )
    })

    test('user: count', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const count = await User.count(client)
        expect(count).toBeGreaterThanOrEqual(2)
    })
})

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
        expect(JSON.stringify(errors)).toMatch((WRONG_PASSWORD_ERROR))
    })

    test('anonymous: SIGNIN_MUTATION by wrong email', async () => {
        const client = await makeClient()
        const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
            'identity': 'some3571592131usermail@example.com',
            'secret': 'wrong password',
        })
        expect(data).toEqual({ 'auth': null })
        expect(JSON.stringify(errors)).toMatch((WRONG_EMAIL_ERROR))
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

// TODO(pahaz): write the tests!
// describe('FORGOT_RECOVERY_CHANGE_PASSWORD', () => {
//     const ALL_FORGOT_PASSWORD_ACTIONS_QUERY = gql`
//         query {
//             objs: allForgotPasswordActions {
//                 id
//                 user {
//                     id
//                 }
//                 token
//             }
//         }
//     `
//
//     const START_PASSWORD_RECOVERY_MUTATION = gql`
//         mutation startPasswordRecovery($email: String!){
//             status: startPasswordRecovery(email: $email)
//         }
//     `
//
//     const CHANGE_PASSWORD_WITH_TOKEN_MUTATION = gql`
//         mutation changePasswordWithToken($token: String!, $password: String!) {
//             status: changePasswordWithToken(token: $token, password: $password)
//         }
//     `
//
//     const ALL_TOKENS_FOR_USER_QUERY = gql`
//         query findTokenForUser($email: String!) {
//             passwordTokens: allForgotPasswordActions(where: { user: { email: $email}}) {
//                 id
//                 token
//                 user {
//                     id
//                 }
//             }
//         }
//     `
//
//     test('anonymous: get all ForgotPasswordActions', async () => {
//         const client = await makeClient()
//         const { data, errors } = await client.query(ALL_FORGOT_PASSWORD_ACTIONS_QUERY)
//         expect(errors[0]).toMatchObject({
//             'data': { 'target': 'allForgotPasswordActions', 'type': 'query' },
//             'message': 'You do not have access to this resource',
//             'name': 'AccessDeniedError',
//             'path': ['objs'],
//         })
//         expect(data).toEqual({ objs: null })
//     })
//
//     test('user: get all ForgotPasswordActions', async () => {
//         const user = await createUser()
//         const client = await makeLoggedInClient(user)
//         const { data, errors } = await client.query(ALL_FORGOT_PASSWORD_ACTIONS_QUERY)
//         expect(errors[0]).toMatchObject({
//             'data': { 'target': 'allForgotPasswordActions', 'type': 'query' },
//             'message': 'You do not have access to this resource',
//             'name': 'AccessDeniedError',
//             'path': ['objs'],
//         })
//         expect(data).toEqual({ objs: null })
//     })
//
//     test('reset forgotten password', async () => {
//         const user = await createUser()
//         const client = await makeClient()
//         const adm = await makeLoggedInAdminClient()
//         const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: user.email })
//         expect(res1.errors).toEqual(undefined)
//         expect(res1.data).toEqual({ status: 'ok' })
//
//         // get created token
//         const { data: { passwordTokens } } = await adm.query(ALL_TOKENS_FOR_USER_QUERY, { email: user.email })
//         expect(passwordTokens).toHaveLength(1)
//         const token = passwordTokens[0].token
//         expect(token).toMatch(/^[a-zA-Z0-9-]{7,40}$/g)
//
//         // change password
//         const password = `${user.password}:${user.password}:new`
//         const res2 = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { token, password })
//         expect(res2.errors).toEqual(undefined)
//         expect(res2.data).toEqual({ status: 'ok' })
//
//         // check logging by new password
//         const newClient = await makeLoggedInClient({ email: user.email, password })
//         expect(newClient.user.id).toEqual(user.id)
//     })
//
//     test('start recovery for unknown email', async () => {
//         const client = await makeClient()
//         const res1 = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, { email: 'random231314@emample.com' })
//         expect(JSON.stringify(res1.errors)).toEqual(expect.stringMatching('unknown-user'))
//     })
//
//     test('change password to empty', async () => {
//         const { id } = await createSchemaObject(ForgotPasswordAction)
//         const obj = await getSchemaObject(ForgotPasswordAction, ['token'], { id })
//         const client = await makeClient()
//         const res1 = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, {
//             token: obj.token, password: '',
//         })
//         expect(res1.data).toEqual({ status: 'ok' })
//     })
// })
