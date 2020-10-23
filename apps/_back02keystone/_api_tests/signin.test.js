/**
 * @jest-environment node
 */

const { createUser, setFakeClientMode } = require('@core/keystone/test.utils')
const { makeClient, makeLoggedInClient, DEFAULT_TEST_USER_IDENTITY, DEFAULT_TEST_USER_SECRET, gql } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

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
