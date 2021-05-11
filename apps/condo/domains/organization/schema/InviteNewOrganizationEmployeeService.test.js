const { inviteNewOrganizationEmployee, makeClientWithRegisteredOrganization } = require('../../../utils/testSchema/Organization')
const { ALREADY_EXISTS_ERROR } = require('@condo/domains/common/constants/errors')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestUser, createTestPhone, createTestEmail } = require('@condo/domains/user/utils/testSchema')
const faker = require('faker')

describe('InviteNewOrganizationEmployeeService', () => {
    test('owner: invite new user', async () => {
        const userAttrs = {
            name: faker.name.firstName(),
            email: createTestEmail(),
            phone: createTestPhone(),
        }
        const client = await makeClientWithRegisteredOrganization()
        const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs)
        expect(employee.email).toEqual(userAttrs.email)
        expect(employee.phone).toEqual(userAttrs.phone)
        expect(employee.name).toEqual(userAttrs.name)
    })

    test('owner: try to invite already registered User by Phone', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const admin = await makeLoggedInAdminClient()
        const [obj, userAttrs] = await createTestUser(admin)
        const employeeUserAttrs = {
            ...userAttrs,
            email: createTestEmail(),
        }

        const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs)

        expect(employee.email).toEqual(employeeUserAttrs.email)
        expect(employee.user.id).toEqual(obj.id)
        expect(employee.phone).toEqual(employeeUserAttrs.phone)
        expect(employee.name).toEqual(employeeUserAttrs.name)
    })

    test('owner: try to invite already registered User by Email', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const admin = await makeLoggedInAdminClient()
        const [obj, userAttrs] = await createTestUser(admin)
        const employeeUserAttrs = {
            ...userAttrs,
            phone: createTestPhone(),
        }

        const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs)

        expect(employee.email).toEqual(employeeUserAttrs.email)
        expect(employee.user.id).toEqual(obj.id)
        expect(employee.phone).toEqual(employeeUserAttrs.phone)
        expect(employee.name).toEqual(employeeUserAttrs.name)
    })

    test('owner: try to invite Employee with duplicate Phone', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const userAttrs = {
            name: faker.name.firstName(),
            email: createTestEmail(),
            phone: createTestPhone(),
        }

        await inviteNewOrganizationEmployee(client, client.organization, userAttrs)
        const secondUserAttrs = {
            ...userAttrs,
            email: createTestEmail(),
        }

        const { errors } = await inviteNewOrganizationEmployee(client, client.organization, secondUserAttrs, {}, { raw: true })

        expect(JSON.stringify(errors)).toContain(ALREADY_EXISTS_ERROR)
    })

    test('owner: try to invite Employee with duplicate Email', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const userAttrs = {
            name: faker.name.firstName(),
            email: createTestEmail(),
            phone: createTestPhone(),
        }

        await inviteNewOrganizationEmployee(client, client.organization, userAttrs)
        const secondUserAttrs = {
            ...userAttrs,
            phone: createTestPhone(),
        }

        const { errors } = await inviteNewOrganizationEmployee(client, client.organization, secondUserAttrs, {}, { raw: true })

        expect(JSON.stringify(errors)).toContain(ALREADY_EXISTS_ERROR)
    })
})

// test('owner: has access to invite/update/delete OrganizationToUserLinks', async () => {
//     const user = await createUser()
//     const user2 = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     const { data: d2 } = await inviteNewOrganizationEmployee(client, data.obj.id, user2.email)
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
//     const { data: d2 } = await inviteNewOrganizationEmployee(client, data.obj.id, user2.email)
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

// async function getInviteCode (id) {
//     const admin = await makeLoggedInAdminClient()
//     const { data, errors } = await admin.query(GET_ORGANIZATION_TO_USER_LINK_CODE_BY_ID_QUERY, { id })
//     expect(errors).toEqual(undefined)
//     expect(data.obj.id).toEqual(id)
//     console.log(data)
//     return data.obj.code
// }

// test('user: accept/reject OrganizationToUserLinks by CODE', async () => {
//     const user = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     // create
//     const { data: d2 } = await inviteNewOrganizationEmployee(client, data.obj.id, 'x2' + user.email)
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