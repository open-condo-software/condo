/**
 * @jest-environment node
 */

const { setFakeClientMode, isMongo } = require('@core/keystone/test.utils')
const { makeLoggedInAdminClient, createUser, gql } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

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
