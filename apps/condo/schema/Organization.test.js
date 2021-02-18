/**
 * @jest-environment node
 */

const { setFakeClientMode } = require('@core/keystone/test.utils')
const { makeLoggedInClient, makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const faker = require('faker')
const { ALREADY_EXISTS_ERROR } = require('../constants/errors')
const { INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION } = require('./Organization.gql')
const { addAdminAccess } = require('./User.test')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('./User.test')

const { createUser } = require('./User.test')
const { Organization, OrganizationEmployee } = require('./Organization.gql')
const { REGISTER_NEW_ORGANIZATION_MUTATION } = require('./Organization.gql')

async function createOrganization (client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const country = 'ru'
    const name = faker.company.companyName()
    const description = faker.company.catchPhrase()
    const meta = {
        dv: 1, inn: '6670428515', kpp: '667001001', city: faker.address.city(), zipCode: faker.address.zipCode(),
        street: faker.address.streetName(), number: faker.address.secondaryAddress(),
        county: faker.address.county(),
    }

    const attrs = {
        dv: 1,
        sender,
        country, name, description, meta,
        ...extraAttrs,
    }
    const obj = await Organization.create(client, attrs)
    return [obj, attrs]
}

async function createOrganizationEmployee (client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!extraAttrs.organization) throw new Error('no extraAttrs.organization')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const email = faker.internet.email().toLowerCase()

    const attrs = {
        dv: 1,
        sender, email,
        ...extraAttrs,
    }
    const obj = await OrganizationEmployee.create(client, attrs)
    return [obj, attrs]
}

async function registerNewOrganization (client, extraAttrs = {}, { raw = false } = {}) {
    if (!client) throw new Error('no client')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const country = 'ru'
    const name = faker.company.companyName()
    const description = faker.company.catchPhrase()
    const meta = {
        dv: 1, inn: '6670428515', kpp: '667001001', city: faker.address.city(), zipCode: faker.address.zipCode(),
        street: faker.address.streetName(), number: faker.address.secondaryAddress(),
        county: faker.address.county(),
    }

    const attrs = {
        dv: 1,
        sender,
        country, name, description, meta,
        ...extraAttrs,
    }

    const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
        data: { ...attrs },
    })
    if (raw) return { data, errors }
    expect(errors).toEqual(undefined)
    return [data.obj, attrs]
}

async function inviteNewUser (client, organization, user, extraAttrs = {}, { raw = false } = {}) {
    if (!client) throw new Error('no client')
    if (!organization) throw new Error('no organization')
    if (!user) throw new Error('no user')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        email: user.email,
        phone: user.phone,
        name: user.name,
        organization: { id: organization.id },
        ...extraAttrs,
    }

    const { data, errors } = await client.mutate(INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION, {
        data: { ...attrs },
    })
    if (raw) return { data, errors }
    expect(errors).toEqual(undefined)
    return [data.obj, attrs]
}

async function makeClientWithRegisteredOrganization () {
    const client = await makeClientWithNewRegisteredAndLoggedInUser()
    const [organization] = await registerNewOrganization(client)
    client.organization = organization
    return client
}

describe('Organization', () => {
    test('anonymous: no access to getAll', async () => {
        const client = await makeClient()
        const { data, errors } = await Organization.getAll(client, {}, { raw: true })
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allOrganizations', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ 'objs': null })
    })

    test('anonymous: no access to count', async () => {
        const client = await makeClient()
        const { data, errors } = await Organization.count(client, {}, { raw: true })
        expect(errors[0]).toMatchObject({
            'data': { 'target': '_allOrganizationsMeta', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['meta', 'count'],
        })
        expect(data).toEqual({ meta: { count: null } })
    })

    test('user: allow to getAll', async () => {
        const admin = await makeLoggedInAdminClient()
        await createOrganization(admin)
        const [, userAttrs] = await createUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const objs = await Organization.getAll(client, {})
        expect(objs.length).toBeGreaterThan(0)
    })

    test('user: allow to count', async () => {
        const admin = await makeLoggedInAdminClient()
        await createOrganization(admin)
        const [, userAttrs] = await createUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const count = await Organization.count(client, {})
        expect(count).toBeGreaterThan(0)
    })
})

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

    test('anonymous/user/admin: update', async () => {
        const anonymous = await makeClient()
        const user = await makeClientWithRegisteredOrganization()
        const admin = await makeLoggedInAdminClient()
        const name = faker.name.firstName()

        {
            const { errors } = await OrganizationEmployee.update(anonymous, user.organization.id, { name }, { raw: true })
            expect(errors[0]).toMatchObject({
                'data': { 'target': 'updateOrganizationEmployee', 'type': 'mutation' },
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': ['obj'],
            })
        }
        // TODO(pahaz): it doesn't work! some bug inside keystonejs: https://github.com/keystonejs/keystone/issues/4829
        // {
        //     const { errors } = await OrganizationEmployee.update(user, user.organization.id, { name }, { raw: true })
        //     expect(errors[0]).toMatchObject({
        //         'data': { 'target': 'updateOrganizationEmployee', 'type': 'mutation' },
        //         'message': 'You do not have access to this resource',
        //         'name': 'AccessDeniedError',
        //         'path': ['obj'],
        //     })
        // }
        {
            const employees = await OrganizationEmployee.getAll(admin, { organization: { id: user.organization.id } })
            expect(employees).toHaveLength(1)
            const obj = await OrganizationEmployee.update(admin, employees[0].id, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'test2' },
                name,
            })
            expect(obj).toMatchObject(expect.objectContaining({ name }))
        }
    })
})

describe('REGISTER_NEW_ORGANIZATION_MUTATION', () => {
    test('registerNewOrganization() by user', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createUser(admin)
        const client = await makeLoggedInClient(userAttrs)

        const name = faker.company.companyName()
        const [org] = await registerNewOrganization(client, { name })

        expect(org.id).toMatch(/^[0-9a-zA-Z-_]+$/)
        expect(org).toEqual(expect.objectContaining({
            name,
        }))

        // Validate Employee and Role!
        const employees = await OrganizationEmployee.getAll(admin, { organization: { id: org.id } })
        expect(employees).toEqual([
            expect.objectContaining({
                user: expect.objectContaining({
                    id: user.id,
                }),
                organization: expect.objectContaining({
                    id: org.id,
                    name,
                }),
                name: user.name,
                email: userAttrs.email,
                phone: userAttrs.phone,
                isAccepted: true,
                isRejected: false,
                role: expect.objectContaining({
                    canManageOrganization: true,
                    canManageEmployees: true,
                    canManageRoles: true,
                }),
            }),
        ])
    })
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

// test('no access to change another organization', async () => {
//     const { id: organizationId } = await createSchemaObject(Organization)
//     const { id: linkId } = await createSchemaObject(OrganizationToUserLink, {
//         organization: { connect: { id: organizationId } },
//         role: 'owner',
//     })
//
//     const user = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     const { errors: err1 } = await client.mutate(UPDATE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: linkId,
//         data: { user: { connect: { id: user.id } } },
//     })
//     expect(err1[0]).toMatchObject({
//         'data': { 'target': 'updateOrganizationToUserLink', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
//     const { errors: err2 } = await client.mutate(UPDATE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: linkId,
//         data: { role: 'member' },
//     })
//     expect(err2[0]).toMatchObject({
//         'data': { 'target': 'updateOrganizationToUserLink', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
// })

describe('INVITE', () => {
    test('owner: invite new user', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createUser(admin)
        const client = await makeClientWithRegisteredOrganization()
        const [employee] = await inviteNewUser(client, client.organization, userAttrs)
        expect(employee.user.id).toEqual(user.id)
        expect(employee.email).toEqual(userAttrs.email)
        expect(employee.phone).toEqual(userAttrs.phone)
        expect(employee.name).toEqual(userAttrs.name)
    })

    test('owner: try to invite already invited user', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createUser(admin)
        const client = await makeClientWithRegisteredOrganization()
        await inviteNewUser(client, client.organization, userAttrs)

        const { errors } = await inviteNewUser(client, client.organization, userAttrs, {}, { raw:true })
        expect(JSON.stringify(errors)).toContain(ALREADY_EXISTS_ERROR)
    })
})


//
// test('owner: try to invite already invited email', async () => {
//     const user = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     // invite
//     await inviteNewUser(client, data.obj.id, 'xm2' + user.email)
//     {
//         const { errors } = await client.mutate(INVITE_NEW_USER_MUTATION, {
//             data: {
//                 organization: { id: data.obj.id },
//                 email: 'xm2' + user.email,
//                 name: 'user2',
//             },
//         })
//         expect(JSON.stringify(errors)).toContain('[error.already.exists]')
//     }
// })
//
// test('owner: has access to invite/update/delete OrganizationToUserLinks', async () => {
//     const user = await createUser()
//     const user2 = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     const { data: d2 } = await inviteNewUser(client, data.obj.id, user2.email)
//
//     // update
//     const { data: d3, errors: err3 } = await client.mutate(UPDATE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: d2.obj.id,
//         data: {
//             role: 'owner',
//         },
//     })
//     expect(err3).toEqual(undefined)
//     expect(d3.obj.role).toEqual('owner')
//
//     // delete
//     const { data: d4, errors: err4 } = await client.mutate(DELETE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: d2.obj.id,
//     })
//     expect(err4).toEqual(undefined)
//     expect(d4.obj.id).toEqual(d2.obj.id)
// })
//
// test('owner: has no access to update OrganizationToUserLinks organization/user attrs', async () => {
//     const { id: organizationId } = await createSchemaObject(Organization)
//     const user = await createUser()
//     const user2 = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     const { data: d2 } = await inviteNewUser(client, data.obj.id, user2.email)
//
//     // update organization
//     const { errors: err3 } = await client.mutate(UPDATE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: d2.obj.id,
//         data: {
//             organization: { connect: { id: organizationId } },
//         },
//     })
//     expect(err3[0]).toMatchObject({
//         'data': { 'target': 'updateOrganizationToUserLink', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
//     // update user
//     const { errors: err4 } = await client.mutate(UPDATE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: d2.obj.id,
//         data: {
//             user: { connect: { id: user2.id } },
//         },
//     })
//     expect(err4[0]).toMatchObject({
//         'data': { 'target': 'updateOrganizationToUserLink', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
// })
//
// const ACCEPT_OR_REJECT_BY_ID_MUTATION = gql`
//     mutation acceptOrReject($id: ID!, $data: AcceptOrRejectOrganizationInviteInput!){
//         obj: acceptOrRejectOrganizationInviteById(id: $id, data: $data) {
//             id isAccepted isRejected
//         }
//     }
// `
//
// const ACCEPT_OR_REJECT_BY_CODE_MUTATION = gql`
//     mutation acceptOrReject($code: String!, $data: AcceptOrRejectOrganizationInviteInput!){
//         obj: acceptOrRejectOrganizationInviteByCode(code: $code, data: $data) {
//             id isAccepted isRejected
//         }
//     }
// `
//
// // TODO(pahaz): check antonymous ACCEPT_OR_REJECT_BY_ID_MUTATION
//
// test('user: accept/reject OrganizationToUserLinks by ID', async () => {
//     const user = await createUser()
//     const user2 = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     // create
//     const { data: d2 } = await inviteNewUser(client, data.obj.id, user2.email)
//
//     // accept
//     const member_client = await makeLoggedInClient(user2)
//     const { data: d3, errors: err3 } = await member_client.mutate(ACCEPT_OR_REJECT_BY_ID_MUTATION, {
//         id: d2.obj.id,
//         data: {
//             isAccepted: true,
//         },
//     })
//     expect(err3).toEqual(undefined)
//     expect(d3.obj).toEqual({
//         id: d2.obj.id,
//         isAccepted: true,
//         isRejected: false,
//     })
//
//     // reject
//     const { data: d4, errors: err4 } = await member_client.mutate(ACCEPT_OR_REJECT_BY_ID_MUTATION, {
//         id: d2.obj.id,
//         data: {
//             isRejected: true,
//         },
//     })
//     expect(err4).toEqual(undefined)
//     expect(d4.obj).toEqual({
//         id: d2.obj.id,
//         isAccepted: false,
//         isRejected: true,
//     })
// })
//
// async function getInviteCode (id) {
//     const admin = await makeLoggedInAdminClient()
//     const { data, errors } = await admin.query(GET_ORGANIZATION_TO_USER_LINK_CODE_BY_ID_QUERY, { id })
//     expect(errors).toEqual(undefined)
//     expect(data.obj.id).toEqual(id)
//     console.log(data)
//     return data.obj.code
// }
//
// test('user: accept/reject OrganizationToUserLinks by CODE', async () => {
//     const user = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     // create
//     const { data: d2 } = await inviteNewUser(client, data.obj.id, 'x2' + user.email)
//     expect(d2.obj.user).toBeNull()
//
//     const code = await getInviteCode(d2.obj.id)
//
//     // accept
//     const user2 = await createUser()
//     const member_client = await makeLoggedInClient(user2)
//     const { data: d3, errors: err3 } = await member_client.mutate(ACCEPT_OR_REJECT_BY_CODE_MUTATION, {
//         code,
//         data: {
//             isAccepted: true,
//         },
//     })
//     expect(err3).toEqual(undefined)
//     expect(d3.obj).toEqual({
//         id: d2.obj.id,
//         isAccepted: true,
//         isRejected: false,
//     })
//
//     // second time!
//     const { errors: err4 } = await member_client.mutate(ACCEPT_OR_REJECT_BY_CODE_MUTATION, {
//         code,
//         data: {
//             isAccepted: true,
//         },
//     })
//     expect(err4[0]).toMatchObject({
//         'data': { 'target': 'acceptOrRejectOrganizationInviteByCode', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
// })

module.exports = {
    createOrganization,
    registerNewOrganization,
}
