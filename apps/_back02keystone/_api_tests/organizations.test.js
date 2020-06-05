const { createSchemaObject, setFakeClientMode } = require('@core/keystone/test.utils')
const { makeLoggedInClient, makeLoggedInAdminClient, makeClient, createUser, gql } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const { Organization, OrganizationToUserLink } = require('../schema/Organization')

const ALL_ORGANIZATIONS_QUERY = gql`
    query {
        objs: allOrganizations {
            id
            name
        }
    }
`

const COUNT_OF_ORGANIZATIONS_QUERY = gql`
    query {
        meta: _allOrganizationsMeta {
            count
        }
    }
`

const ALL_ORGANIZATION_TO_USER_LINKS_QUERY = gql`
    query {
        objs: allOrganizationToUserLinks {
            id
            user {
                id
                name
            }
            organization {
                id
                name
            }
        }
    }
`

const COUNT_OF_ORGANIZATION_TO_USER_LINKS_QUERY = gql`
    query {
        meta: _allOrganizationToUserLinksMeta {
            count
        }
    }
`

const GET_ORGANIZATION_TO_USER_LINK_QUERY = gql`
    query getObj($id: ID!) {
        obj: OrganizationToUserLink (where: {id: $id}) {
            id
            organization {
                id
                name
            }
            user {
                id
                name
            }
            role
        }
    }
`

const DELETE_ORGANIZATION_TO_USER_LINK_MUTATION = gql`
    mutation delObj($id: ID!) {
        obj: deleteOrganizationToUserLink(id: $id) {
            id
            role
        }
    }
`

const GET_ORGANIZATION_WITH_LINKS_QUERY = gql`
    query q($id: ID!) {
        obj: Organization (where: {id: $id}) {
            id
            userLinks {
                organization {
                    id
                }
                user {
                    id
                }
                role
                id
            }
        }
    }
`

test('anonymous: get all Organizations', async () => {
    const client = await makeClient()
    const { data, errors } = await client.query(ALL_ORGANIZATIONS_QUERY)
    expect(errors[0]).toMatchObject({
        'data': { 'target': 'allOrganizations', 'type': 'query' },
        'message': 'You do not have access to this resource',
        'name': 'AccessDeniedError',
        'path': ['objs'],
    })
    expect(data).toEqual({ 'objs': null })
})

test('anonymous: get count of Organizations', async () => {
    const client = await makeClient()
    const { data, errors } = await client.query(COUNT_OF_ORGANIZATIONS_QUERY)
    expect(errors[0]).toMatchObject({
        'data': { 'target': '_allOrganizationsMeta', 'type': 'query' },
        'message': 'You do not have access to this resource',
        'name': 'AccessDeniedError',
        'path': ['meta', 'count'],
    })
    expect(data).toEqual({ meta: { count: null } })
})

test('user: get all Organizations', async () => {
    await createSchemaObject(Organization)
    const user = await createUser()
    const client = await makeLoggedInClient(user)
    const { data, errors } = await client.query(ALL_ORGANIZATIONS_QUERY)
    expect(errors).toEqual(undefined)
    expect(data.objs.length).toBeGreaterThan(0)
})

test('user: get count of Organizations', async () => {
    await createSchemaObject(Organization)
    const user = await createUser()
    const client = await makeLoggedInClient(user)
    const { data } = await client.query(COUNT_OF_ORGANIZATIONS_QUERY)
    expect(data.meta.count).toBeGreaterThan(0)
})

test('anonymous: get all OrganizationToUserLinks', async () => {
    const client = await makeClient()
    const { data, errors } = await client.query(ALL_ORGANIZATION_TO_USER_LINKS_QUERY)
    expect(errors[0]).toMatchObject({
        'data': { 'target': 'allOrganizationToUserLinks', 'type': 'query' },
        'message': 'You do not have access to this resource',
        'name': 'AccessDeniedError',
        'path': ['objs'],
    })
    expect(data).toEqual({ 'objs': null })
})

test('anonymous: get count of OrganizationToUserLinks', async () => {
    const client = await makeClient()
    const { data, errors } = await client.query(COUNT_OF_ORGANIZATION_TO_USER_LINKS_QUERY)
    expect(errors[0]).toMatchObject({
        'data': { 'target': '_allOrganizationToUserLinksMeta', 'type': 'query' },
        'message': 'You do not have access to this resource',
        'name': 'AccessDeniedError',
        'path': ['meta', 'count'],
    })
    expect(data).toEqual({ meta: { count: null } })
})

test('user: get all OrganizationToUserLinks', async () => {
    await createSchemaObject(OrganizationToUserLink)
    const user = await createUser()
    const client = await makeLoggedInClient(user)
    const { data, errors } = await client.query(ALL_ORGANIZATION_TO_USER_LINKS_QUERY)
    expect(errors).toEqual(undefined)
    expect(data.objs.length).toEqual(0)
})

test('user: get count of OrganizationToUserLinks', async () => {
    await createSchemaObject(OrganizationToUserLink)
    const user = await createUser()
    const client = await makeLoggedInClient(user)
    const { data } = await client.query(COUNT_OF_ORGANIZATION_TO_USER_LINKS_QUERY)
    expect(data.meta.count).toEqual(0)
})

test('user: hide OrganizationToUserLink for everyone who not in userLinks', async () => {
    await createSchemaObject(OrganizationToUserLink)
    const { id, _raw_query_data } = await createSchemaObject(OrganizationToUserLink)
    const organization = _raw_query_data.organization.create
    const user = _raw_query_data.user.create
    expect(user.email).toMatch(/^.+$/g)
    expect(user.password).toMatch(/^.+$/g)
    expect(organization.name).toMatch(/^.+$/g)

    // check by member
    const client_member = await makeLoggedInClient(user)
    const { data: data1, errors: errors1 } = await client_member.query(ALL_ORGANIZATION_TO_USER_LINKS_QUERY)
    expect(errors1).toEqual(undefined)
    expect(data1.objs).toEqual([expect.objectContaining({
        id,
        user: expect.objectContaining({ id: client_member.user.id }),
        organization: expect.objectContaining({ name: organization.name }),
    })])

    const { data: data2, errors: errors2 } = await client_member.query(COUNT_OF_ORGANIZATION_TO_USER_LINKS_QUERY)
    expect(errors2).toEqual(undefined)
    expect(data2.meta.count).toEqual(1)
})

test('user: access to change OrganizationToUserLink only for owners', async () => {
    const user1 = await createUser()
    const user2 = await createUser()
    const user3 = await createUser()
    const { id: organizationId } = await createSchemaObject(Organization)
    const { id: link1Id } = await createSchemaObject(OrganizationToUserLink, {
        organization: { connect: { id: organizationId } },
        user: { connect: { id: user1.id } },
        role: 'owner',
    })
    const { id: link2Id } = await createSchemaObject(OrganizationToUserLink, {
        organization: { connect: { id: organizationId } },
        user: { connect: { id: user2.id } },
        role: 'member',
    })
    const { id: link3Id } = await createSchemaObject(OrganizationToUserLink, {
        organization: { connect: { id: organizationId } },
        user: { connect: { id: user3.id } },
        role: 'member',
    })
    const client_owner = await makeLoggedInClient(user1)

    // check DB state
    const { data: data0, errors: errors0 } = await client_owner.query(GET_ORGANIZATION_WITH_LINKS_QUERY, { id: organizationId })
    expect(errors0).toEqual(undefined)
    expect(data0.obj).toEqual({
        'id': organizationId,
        'userLinks': [
            {
                'id': link1Id,
                'organization': {
                    'id': organizationId,
                },
                'role': 'owner',
                'user': {
                    'id': user1.id,
                },
            },
            {
                'id': link2Id,
                'organization': {
                    'id': organizationId,
                },
                'role': 'member',
                'user': {
                    'id': user2.id,
                },
            },
            {
                'id': link3Id,
                'organization': {
                    'id': organizationId,
                },
                'role': 'member',
                'user': {
                    'id': user3.id,
                },
            },
        ],
    })

    // delete user 3
    const { data: data2, errors: errors2 } = await client_owner.mutate(DELETE_ORGANIZATION_TO_USER_LINK_MUTATION, { id: link3Id })
    expect(errors2).toEqual(undefined)
    expect(data2.obj).toEqual(expect.objectContaining({ id: link3Id }))

    const client_member = await makeLoggedInClient(user2)
    const { data: data3, errors: errors3 } = await client_member.query(GET_ORGANIZATION_WITH_LINKS_QUERY, { id: organizationId })
    expect(errors3).toEqual(undefined)
    expect(data3.obj).toEqual({
        'id': organizationId,
        'userLinks': [
            {
                'id': link1Id,
                'organization': {
                    'id': organizationId,
                },
                'role': 'owner',
                'user': {
                    'id': user1.id,
                },
            },
            {
                'id': link2Id,
                'organization': {
                    'id': organizationId,
                },
                'role': 'member',
                'user': {
                    'id': user2.id,
                },
            },
        ],
    })

    // try to delete user 1
    const { data: data4, errors: errors4 } = await client_member.mutate(DELETE_ORGANIZATION_TO_USER_LINK_MUTATION, { id: link1Id })
    expect(errors4[0]).toMatchObject({
        'data': { 'target': 'deleteOrganizationToUserLink', 'type': 'mutation' },
        'message': 'You do not have access to this resource',
        'name': 'AccessDeniedError',
        'path': ['obj'],
    })
    expect(data4).toEqual({ 'obj': null })
})
