/**
 * @jest-environment node
 */

const { setFakeClientMode } = require('@core/keystone/test.utils')
const { makeLoggedInClient, makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const faker = require('faker')

const { createUser } = require('./User.test')
const { Organization, OrganizationEmployee, OrganizationEmployeeRole } = require('./Organization.gql')
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

describe('Organization', () => {
    test('anonymous: getAll', async () => {
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

    test('anonymous: count', async () => {
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

    test('user: getAll', async () => {
        const admin = await makeLoggedInAdminClient()
        const [org] = await createOrganization(admin)
        const [user, userAttrs] = await createUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const objs = await Organization.getAll(client, {})
        expect(objs.length).toBeGreaterThan(0)
    })

    test('user: count', async () => {
        const admin = await makeLoggedInAdminClient()
        const [org] = await createOrganization(admin)
        const [user, userAttrs] = await createUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const count = await Organization.count(client, {})
        expect(count).toBeGreaterThan(0)
    })
})

describe('REGISTER_NEW_ORGANIZATION_MUTATION', () => {
    test('registerNewOrganization() by user', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createUser(admin)
        const client = await makeLoggedInClient(userAttrs)

        const name = faker.company.companyName()
        const [obj] = await registerNewOrganization(client, { name })

        expect(obj.id).toMatch(/^[0-9a-zA-Z-_]+$/)
        expect(obj).toEqual(expect.objectContaining({
            name,
        }))

        // TODO(pahaz): validate EmployeeObject and Role!
    })
})

// test('anonymous: get all OrganizationToUserLinks', async () => {
//     const client = await makeClient()
//     const { data, errors } = await client.query(ALL_ORGANIZATION_TO_USER_LINKS_QUERY)
//     expect(errors[0]).toMatchObject({
//         'data': { 'target': 'allOrganizationToUserLinks', 'type': 'query' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['objs'],
//     })
//     expect(data).toEqual({ 'objs': null })
// })
//
// test('anonymous: get count of OrganizationToUserLinks', async () => {
//     const client = await makeClient()
//     const { data, errors } = await client.query(COUNT_OF_ORGANIZATION_TO_USER_LINKS_QUERY)
//     expect(errors[0]).toMatchObject({
//         'data': { 'target': '_allOrganizationToUserLinksMeta', 'type': 'query' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['meta', 'count'],
//     })
//     expect(data).toEqual({ meta: { count: null } })
// })
//
// test('user: get all OrganizationToUserLinks', async () => {
//     await createSchemaObject(OrganizationToUserLink)
//     const user = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.query(ALL_ORGANIZATION_TO_USER_LINKS_QUERY)
//     expect(errors).toEqual(undefined)
//     expect(data.objs).toHaveLength(0)
// })
//
// test('user: get count of OrganizationToUserLinks', async () => {
//     await createSchemaObject(OrganizationToUserLink)
//     const user = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data } = await client.query(COUNT_OF_ORGANIZATION_TO_USER_LINKS_QUERY)
//     expect(data.meta.count).toEqual(0)
// })
//
// test('user: hide OrganizationToUserLink for everyone who not in userLinks', async () => {
//     await createSchemaObject(OrganizationToUserLink)
//     const { id, _raw_query_data } = await createSchemaObject(OrganizationToUserLink)
//     const organization = _raw_query_data.organization.create
//     const user = _raw_query_data.user.create
//     expect(user.email).toMatch(/^.+$/g)
//     expect(user.password).toMatch(/^.+$/g)
//     expect(organization.name).toMatch(/^.+$/g)
//
//     // check by member
//     const client_member = await makeLoggedInClient(user)
//     const { data: data1, errors: errors1 } = await client_member.query(ALL_ORGANIZATION_TO_USER_LINKS_QUERY)
//     expect(errors1).toEqual(undefined)
//     expect(data1.objs).toEqual([expect.objectContaining({
//         id,
//         user: expect.objectContaining({ id: client_member.user.id }),
//         organization: expect.objectContaining({ name: organization.name }),
//     })])
//
//     const { data: data2, errors: errors2 } = await client_member.query(COUNT_OF_ORGANIZATION_TO_USER_LINKS_QUERY)
//     expect(errors2).toEqual(undefined)
//     expect(data2.meta.count).toEqual(1)
// })
//
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
//
// const INVITE_NEW_USER_MUTATION = gql`
//     mutation inviteNewUser($data: InviteNewUserToOrganizationInput!) {
//         obj: inviteNewUserToOrganization(data: $data) {
//             id
//             role
//             user {
//                 id
//             }
//         }
//     }
// `
//
// async function inviteNewUser (client, organizationId, email) {
//     const { data, errors } = await client.mutate(INVITE_NEW_USER_MUTATION, {
//         data: {
//             organization: { id: organizationId },
//             email: email,
//             name: 'user2',
//         },
//     })
//     expect(errors).toEqual(undefined)
//     expect(data.obj.id).toMatch(/^[0-9a-zA-Z-_]+$/)
//     expect(data.obj.role).toEqual('member')
//     return { data }
// }
//
// test('owner: invite new user', async () => {
//     const user = await createUser()
//     const user2 = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     // invite
//     const { data: d2 } = await inviteNewUser(client, data.obj.id, user2.email)
//     expect(d2.obj.user.id).toEqual(user2.id)
// })
//
// test('owner: try to invite already invited user', async () => {
//     const user = await createUser()
//     const user2 = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     // invite
//     await inviteNewUser(client, data.obj.id, user2.email)
//     {
//         const { errors } = await client.mutate(INVITE_NEW_USER_MUTATION, {
//             data: {
//                 organization: { id: data.obj.id },
//                 email: user2.email,
//                 name: 'user2',
//             },
//         })
//         expect(JSON.stringify(errors)).toContain('[error.already.exists]')
//     }
// })
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
