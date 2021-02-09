/**
 * @jest-environment node
 */

const conf = require('@core/config')
const { setFakeClientMode } = require('@core/keystone/test.utils')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const faker = require('faker')
const { getRandomString, isMongo, DEFAULT_TEST_USER_IDENTITY, DEFAULT_TEST_USER_SECRET, gql } = require('@core/keystone/test.utils')
const { makeClient, makeLoggedInClient, createUser, getSchemaObject, createSchemaObject, makeLoggedInAdminClient } = require('@core/keystone/test.utils')

const { User, ForgotPasswordAction } = require('../schema/User')

describe('MODEL', () => {
    const GET_USER_BY_ID_QUERY = gql`
        query getUserById($id: ID!) {
            user: User(where: {id: $id}) {
                id
                email
                name
            }
        }
    `

    test('user: convert email to lower case', async () => {
        const client = await makeLoggedInAdminClient()
        const email = 'XXX' + getRandomString() + '@example.com'
        const user = await createUser({ email })

        const { data } = await client.query(GET_USER_BY_ID_QUERY, { id: user.id })
        expect(data.user).toEqual({ email: email.toLowerCase(), id: user.id, name: user.name })

        const client2 = await makeLoggedInClient({ email: email.toLowerCase(), password: user.password })
        expect(client2.user.id).toEqual(user.id)

        // TODO(pahaz): fix in a future (it's no OK if you can't logged in by upper case email)
        const checkAuthByUpperCaseEmail = async () => {
            await makeLoggedInClient({ email, password: user.password })
        }
        await expect(checkAuthByUpperCaseEmail).rejects.toThrow(/passwordAuth:identity:notFound/)
    })

    test('createSchemaObject()', async () => {
        const { id } = await createSchemaObject(User)
        expect(id).toMatch(/^[A-Za-z0-9-]+$/g)
    })
})

describe('QUERY ALL/COUNT ACCESS', () => {
    const ALL_USERS_QUERY = gql`
        query {
            users: allUsers {
                id
                email
                name
            }
        }
    `

    const COUNT_OF_USERS_QUERY = gql`
        query {
            meta: _allUsersMeta {
                count
            }
        }
    `

    test('anonymous: get all users', async () => {
        const client = await makeClient()
        const { data, errors } = await client.query(ALL_USERS_QUERY)
        expect(data).toEqual({ users: null })
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allUsers', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['users'],
        })
    })

    test('anonymous: get count of users', async () => {
        const client = await makeClient()
        const { data, errors } = await client.query(COUNT_OF_USERS_QUERY)
        expect(data).toEqual({ meta: { count: null } })
        expect(errors[0]).toMatchObject({
            'data': { 'target': '_allUsersMeta', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['meta', 'count'],
        })
    })

    test('user: get all users', async () => {
        const user = await createUser()
        const client = await makeLoggedInClient(user)
        const { data } = await client.query(ALL_USERS_QUERY)
        expect(data.users).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: user.id, name: user.name, email: user.email }),
                expect.objectContaining({ email: null }),
            ]),
        )
    })

    test('user: get count of users', async () => {
        const user = await createUser()
        const client = await makeLoggedInClient(user)
        const { data } = await client.query(COUNT_OF_USERS_QUERY)
        expect(data.meta.count).toBeGreaterThanOrEqual(2)
    })
})

describe('SIGNIN', () => {
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
    const REGISTER_NEW_USER_MUTATION = gql`
        mutation registerNewUser($data: RegisterNewUserInput!) {
            user: registerNewUser(data: $data) {
                id
            }
        }
    `

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

describe('MODEL User.settings field', () => {
    const USER_FIELDS = '{ id settings { Feature1 Feature2 } }'
    const GET_USER_BY_ID_QUERY = gql`
        query getUserById($id: ID!) {
            user: User(where: {id: $id}) ${USER_FIELDS}
        }
    `

    const UPDATE_USER_BY_ID_MUTATION = gql`
        mutation updateUserById($id:ID!, $data: UserUpdateInput!) {
            user: updateUser(id: $id, data: $data) ${USER_FIELDS}
        }
    `

    const ALL_USERS_QUERY = gql`
        query getAll($data: UserWhereInput!) {
            users: allUsers(where: $data) ${USER_FIELDS}
        }
    `

    test('user: set settings', async () => {
        const client = await makeLoggedInAdminClient()
        const user = await createUser({ settings: { 'Feature1': true } })
        console.log('user.id', user.id)

        const { data, errors } = await client.query(GET_USER_BY_ID_QUERY, { id: user.id })
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual({
            id: user.id,
            settings: {
                'Feature1': true,
                'Feature2': null,
            },
        })
    })

    test('user: set unknown settings', async () => {
        async function run () {
            return await createUser({ settings: { 'Feature22': true, 'Feature1': true } })
        }

        await expect(run).rejects.toThrow(/Variable "\$data" got invalid value/)
    })

    test('user: set settings = null', async () => {
        const client = await makeLoggedInAdminClient()
        const user = await createUser({ settings: null })
        console.log('user.id', user.id)

        const { data, errors } = await client.query(GET_USER_BY_ID_QUERY, { id: user.id })
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual({
            id: user.id,
            settings: {
                'Feature1': null,
                'Feature2': null,
            },
        })
    })

    test('user: set settings value = null', async () => {
        const client = await makeLoggedInAdminClient()
        const user = await createUser({ settings: { 'Feature1': null } })
        console.log('user.id', user.id)

        const { data, errors } = await client.query(GET_USER_BY_ID_QUERY, { id: user.id })
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual({
            id: user.id,
            settings: {
                'Feature1': null,
                'Feature2': null,
            },
        })
    })

    test('user: set settings = undefined', async () => {
        const client = await makeLoggedInAdminClient()
        const user = await createUser({ settings: undefined })
        console.log('user.id', user.id)

        const { data, errors } = await client.query(GET_USER_BY_ID_QUERY, { id: user.id })
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual({
            id: user.id,
            settings: {
                'Feature1': null,
                'Feature2': null,
            },
        })
    })

    test('user: set settings = {}', async () => {
        const client = await makeLoggedInAdminClient()
        const user = await createUser({ settings: {} })
        console.log('user.id', user.id)

        const { data, errors } = await client.query(GET_USER_BY_ID_QUERY, { id: user.id })
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual({
            id: user.id,
            settings: {
                'Feature1': null,
                'Feature2': null,
            },
        })
    })

    test('user: merge settings', async () => {
        const client = await makeLoggedInAdminClient()
        const user = await createUser({ settings: { 'Feature1': false } })
        console.log('user.id', user.id)

        const { data, errors } = await client.mutate(UPDATE_USER_BY_ID_MUTATION, {
            id: user.id,
            data: { settings: { 'Feature2': true } },
        })
        expect(errors).toEqual(undefined)
        expect(data.user).toEqual({
            id: user.id,
            settings: {
                'Feature1': false,
                'Feature2': true,
            },
        })
    })

    test('user: filter settings by EQ', async () => {
        if (isMongo()) return console.error('SKIP() Mongo: need a custom query parser!')

        const client = await makeLoggedInAdminClient()
        const user1 = await createUser({ settings: { 'Feature1': true } })
        const user2 = await createUser({ settings: { 'Feature1': true } })
        const user3 = await createUser({ settings: { 'Feature1': false } })
        {
            const { data, errors } = await client.query(ALL_USERS_QUERY, { data: { settings: { 'Feature1': true } } })
            expect(errors).toEqual(undefined)
            const ids = data.users.map(x => x.id)
            expect(ids).toContain(user1.id)
            expect(ids).toContain(user2.id)
            expect(ids).not.toContain(user3.id)
        }
        {
            const { data, errors } = await client.query(ALL_USERS_QUERY, { data: { settings: { 'Feature1': false } } })
            expect(errors).toEqual(undefined)
            const ids = data.users.map(x => x.id)
            expect(ids).not.toContain(user1.id)
            expect(ids).not.toContain(user2.id)
            expect(ids).toContain(user3.id)
        }
    })

    test('user: filter settings by NULL', async () => {
        const client = await makeLoggedInAdminClient()
        const user1 = await createUser({ settings: null })
        const user2 = await createUser({ settings: undefined })
        const user3 = await createUser({ settings: {} })
        const user4 = await createUser({ settings: { 'Feature1': null } })
        const user5 = await createUser({ settings: { 'Feature1': undefined } })
        const user6 = await createUser({ settings: { 'Feature1': false } })
        const user7 = await createUser({ settings: { 'Feature1': true } })
        {
            const { data, errors } = await client.query(ALL_USERS_QUERY, { data: { settings: null } })
            expect(errors).toEqual(undefined)
            const ids = data.users.map(x => x.id)
            expect(ids).toContain(user1.id)
            expect(ids).toContain(user2.id)
            expect(ids).toContain(user3.id)
            expect(ids).toContain(user4.id)
            expect(ids).toContain(user5.id)
            expect(ids).not.toContain(user6.id)
            expect(ids).not.toContain(user7.id)
        }
    })

    test('user: filter settings by IN', async () => {
        const client = await makeLoggedInAdminClient()
        const user1 = await createUser({ settings: null })
        const user2 = await createUser({ settings: undefined })
        const user3 = await createUser({ settings: {} })
        const user4 = await createUser({ settings: { 'Feature1': null } })
        const user5 = await createUser({ settings: { 'Feature1': undefined } })
        const user6 = await createUser({ settings: { 'Feature1': false } })
        const user7 = await createUser({ settings: { 'Feature1': true } })
        const user8 = await createUser({ settings: { 'Feature1': true, 'Feature2': true } })
        const user9 = await createUser({ settings: { 'Feature1': true, 'Feature2': false } })
        {
            const { data, errors } = await client.query(ALL_USERS_QUERY, { data: { settings_in: [null, { 'Feature1': true }] } })
            expect(errors).toEqual(undefined)
            const ids = data.users.map(x => x.id)
            expect(ids).toContain(user1.id)
            expect(ids).toContain(user2.id)
            expect(ids).toContain(user3.id)
            expect(ids).toContain(user4.id)
            expect(ids).toContain(user5.id)
            expect(ids).not.toContain(user6.id)
            expect(ids).toContain(user7.id)
            expect(ids).not.toContain(user8.id)
            expect(ids).not.toContain(user9.id)
        }
    })
})

