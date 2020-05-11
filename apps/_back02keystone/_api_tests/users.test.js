const { createSchemaObject } = require('@core/keystone/test.utils')
const { makeLoggedInClient, makeClient, createUser, gql } = require('@core/keystone/test.utils')

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

test('createSchemaObject()', async () => {
    const user = await createSchemaObject(User)
    expect(user.id).toMatch(/^[A-Za-z0-9-]+$/g)
})
