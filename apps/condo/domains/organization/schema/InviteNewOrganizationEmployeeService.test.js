const { inviteNewOrganizationEmployee, makeClientWithRegisteredOrganization } = require('../../../utils/testSchema/Organization')
const { ALREADY_EXISTS_ERROR } = require('@condo/domains/common/constants/errors')


describe('InviteNewOrganizationEmployeeService', () => {
    test('owner: invite new user', async () => {
        const userAttrs = {
            email: 'exmaple@mail.ru',
            phone: '79999999999',
            name: 'User Name',
        }
        const client = await makeClientWithRegisteredOrganization()
        const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs)
        expect(employee.email).toEqual(userAttrs.email)
        expect(employee.phone).toEqual(userAttrs.phone)
        expect(employee.name).toEqual(userAttrs.name)
    })

    test('owner: try to invite already invited user', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const userAttrs = {
            email: 'exmaple2@mail.ru',
            phone: '79999999998',
            name: 'User Name',
        }
        await inviteNewOrganizationEmployee(client, client.organization, userAttrs)

        const { errors } = await inviteNewOrganizationEmployee(client, client.organization, userAttrs, {}, { raw: true })
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