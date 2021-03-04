/**
 * @jest-environment node
 */

const { setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const faker = require('faker')
const { createOrganizationEmployee } = require('../../utils/testSchema/Organization')
const { makeClientWithRegisteredOrganization } = require('../../utils/testSchema/Organization')
const { getRandomString } = require('@core/keystone/test.utils')
const { addAdminAccess } = require('../../utils/testSchema/User')
const { OrganizationEmployee } = require('../../gql/Organization')

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../../index'))

describe('OrganizationEmployee', () => {
    test('anonymous: no access to getAll', async () => {
        const client = await makeClient()
        const { data, errors } = await OrganizationEmployee.getAll(client, {}, { raw: true })
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allOrganizationEmployees', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ 'objs': null })
    })

    test('anonymous: no access to count', async () => {
        const client = await makeClient()
        const { data, errors } = await OrganizationEmployee.count(client, {}, { raw: true })
        expect(errors[0]).toMatchObject({
            'data': { 'target': '_allOrganizationEmployeesMeta', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['meta', 'count'],
        })
        expect(data).toEqual({ meta: { count: null } })
    })

    test('user: allow to getAll only for employee', async () => {
        const client1 = await makeClientWithRegisteredOrganization()
        const client2 = await makeClientWithRegisteredOrganization()
        const objs1 = await OrganizationEmployee.getAll(client1, {})
        const objs2 = await OrganizationEmployee.getAll(client2, {})
        expect(objs1).toHaveLength(1)
        expect(objs2).toHaveLength(1)
        expect(objs1[0].id).not.toEqual(objs2[0].id)
    })

    test('user: allow to count ony for employee', async () => {
        const client1 = await makeClientWithRegisteredOrganization()
        const client2 = await makeClientWithRegisteredOrganization()
        const count1 = await OrganizationEmployee.count(client1, {})
        const count2 = await OrganizationEmployee.count(client2, {})
        expect(count1).toEqual(1)
        expect(count2).toEqual(1)
    })

    test('admin: allow to getAll', async () => {
        const client1 = await makeClientWithRegisteredOrganization()
        await addAdminAccess(client1.user)
        const objs1 = await OrganizationEmployee.getAll(client1, {})
        expect(objs1.length).toBeGreaterThan(1)
    })

    test('admin: allow to count all', async () => {
        const client1 = await makeClientWithRegisteredOrganization()
        await addAdminAccess(client1.user)
        const count1 = await OrganizationEmployee.count(client1, {})
        expect(count1).toBeGreaterThan(1)
    })

    // TODO(pahaz): can create/update/(change organization field)/delete ? (user/anonimous)

    test('anonymous/user/admin: create', async () => {
        const anonymous = await makeClient()
        const user = await makeClientWithRegisteredOrganization()
        const admin = await makeLoggedInAdminClient()

        {
            const { errors } = await OrganizationEmployee.create(anonymous, {}, { raw: true })
            expect(errors[0]).toMatchObject({
                'data': { 'target': 'createOrganizationEmployee', 'type': 'mutation' },
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': ['obj'],
            })
        }
        {
            const { errors } = await OrganizationEmployee.create(user, {}, { raw: true })
            expect(errors[0]).toMatchObject({
                'data': { 'target': 'createOrganizationEmployee', 'type': 'mutation' },
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': ['obj'],
            })
        }
        {
            const obj = await createOrganizationEmployee(admin, {
                organization: { connect: { id: user.organization.id } },
            })
            expect(obj).toMatchObject(expect.objectContaining({}))
        }
    })

    test('anonymous/user/hacker/admin: update', async () => {
        const anonymousClient = await makeClient()
        const userClient = await makeClientWithRegisteredOrganization()
        const hackerClient = await makeClientWithRegisteredOrganization()
        const adminClient = await makeLoggedInAdminClient()
        const employees = await OrganizationEmployee.getAll(adminClient, {
            organization: { id: userClient.organization.id },
            user: { id: userClient.user.id },
        })
        expect(employees).toHaveLength(1)
        const employee = employees[0]

        {
            const attrs = {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
            }
            const { errors } = await OrganizationEmployee.update(anonymousClient, employee.id, attrs, { raw: true })
            expect(errors[0]).toMatchObject({
                'data': { 'target': 'updateOrganizationEmployee', 'type': 'mutation' },
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': ['obj'],
            })
        }
        {
            const attrs = {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
            }
            const { errors } = await OrganizationEmployee.update(hackerClient, employee.id, attrs, { raw: true })
            expect(errors[0]).toMatchObject({
                'data': { 'target': 'updateOrganizationEmployee', 'type': 'mutation' },
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': ['obj'],
            })
        }
        {
            const attrs = {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
            }
            const obj = await OrganizationEmployee.update(userClient, employee.id, attrs)
            expect(obj).toMatchObject(expect.objectContaining(attrs))
        }
        {
            const attrs = {
                dv: 1,
                sender: { dv: 1, fingerprint: getRandomString() },
                name: faker.name.firstName(),
            }
            const obj = await OrganizationEmployee.update(adminClient, employee.id, attrs)
            expect(obj).toMatchObject(expect.objectContaining(attrs))
        }
    })

    // test('user: access to change OrganizationToUserLink only for owners', async () => {
//     const user1 = await createUser()
//     const user2 = await createUser()
//     const user3 = await createUser()
//     const { id: organizationId } = await createSchemaObject(Organization)
//     const { id: link1Id } = await createSchemaObject(OrganizationToUserLink, {
//         organization: { connect: { id: organizationId } },
//         user: { connect: { id: user1.id } },
//         role: 'owner',
//     })
//     const { id: link2Id } = await createSchemaObject(OrganizationToUserLink, {
//         organization: { connect: { id: organizationId } },
//         user: { connect: { id: user2.id } },
//         role: 'member',
//     })
//     const { id: link3Id } = await createSchemaObject(OrganizationToUserLink, {
//         organization: { connect: { id: organizationId } },
//         user: { connect: { id: user3.id } },
//         role: 'member',
//     })
//     const client_owner = await makeLoggedInClient(user1)
//
//     // check DB state
//     const { data: data0, errors: errors0 } = await client_owner.query(GET_ORGANIZATION_WITH_LINKS_QUERY, { id: organizationId })
//     expect(errors0).toEqual(undefined)
//     expect(data0.obj).toEqual({
//         'id': organizationId,
//         'userLinks': [
//             {
//                 'id': link1Id,
//                 'organization': {
//                     'id': organizationId,
//                 },
//                 'role': 'owner',
//                 'user': {
//                     'id': user1.id,
//                 },
//             },
//             {
//                 'id': link2Id,
//                 'organization': {
//                     'id': organizationId,
//                 },
//                 'role': 'member',
//                 'user': {
//                     'id': user2.id,
//                 },
//             },
//             {
//                 'id': link3Id,
//                 'organization': {
//                     'id': organizationId,
//                 },
//                 'role': 'member',
//                 'user': {
//                     'id': user3.id,
//                 },
//             },
//         ],
//     })
//
//     // delete user 3
//     const { data: data2, errors: errors2 } = await client_owner.mutate(DELETE_ORGANIZATION_TO_USER_LINK_MUTATION, { id: link3Id })
//     expect(errors2).toEqual(undefined)
//     expect(data2.obj).toEqual(expect.objectContaining({ id: link3Id }))
//
//     const client_member = await makeLoggedInClient(user2)
//     const { data: data3, errors: errors3 } = await client_member.query(GET_ORGANIZATION_WITH_LINKS_QUERY, { id: organizationId })
//     expect(errors3).toEqual(undefined)
//     expect(data3.obj).toEqual({
//         'id': organizationId,
//         'userLinks': [
//             {
//                 'id': link1Id,
//                 'organization': {
//                     'id': organizationId,
//                 },
//                 'role': 'owner',
//                 'user': {
//                     'id': user1.id,
//                 },
//             },
//             {
//                 'id': link2Id,
//                 'organization': {
//                     'id': organizationId,
//                 },
//                 'role': 'member',
//                 'user': {
//                     'id': user2.id,
//                 },
//             },
//         ],
//     })
//
//     // try to delete user 1
//     const { data: data4, errors: errors4 } = await client_member.mutate(DELETE_ORGANIZATION_TO_USER_LINK_MUTATION, { id: link1Id })
//     expect(errors4[0]).toMatchObject({
//         'data': { 'target': 'deleteOrganizationToUserLink', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
//     expect(data4).toEqual({ 'obj': null })
// })
//
})