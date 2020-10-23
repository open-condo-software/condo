/**
 * @jest-environment node
 */

const { createSchemaObject, setFakeClientMode, getRandomString } = require('@core/keystone/test.utils')
const { makeLoggedInClient, makeLoggedInAdminClient, makeClient, createUser, gql } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const { User } = require('../schema/User')

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

const GET_USER_BY_ID_QUERY = gql`
    query getUserById($id: ID!) {
        user: User(where: {id: $id}) {
            id
            email
            name
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
