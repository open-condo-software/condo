const {
    inviteNewOrganizationEmployee,
    reInviteNewOrganizationEmployee,
    makeClientWithRegisteredOrganization,
    acceptOrRejectOrganizationInviteById,
} = require('@condo/domains/organization/utils/testSchema/Organization')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { ALREADY_EXISTS_ERROR } = require('@condo/domains/common/constants/errors')
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const { createTestUser, createTestPhone, createTestEmail } = require('@condo/domains/user/utils/testSchema')
const faker = require('faker')
const { createTestTicketCategoryClassifier } = require('@condo/domains/ticket/utils/testSchema')
const { pick } = require('lodash')
const { expectToThrowAuthenticationErrorToObj } = require('@condo/domains/common/utils/testSchema')

describe('InviteNewOrganizationEmployeeService', () => {
    describe('inviteNewOrganizationEmployee', () => {
        describe('called by organization owner', () => {
            describe('for not registered User', () => {
                it('returns new employee with specified contacts and specializations', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const [categoryClassifier1] = await createTestTicketCategoryClassifier(admin)
                    const [categoryClassifier2] = await createTestTicketCategoryClassifier(admin)

                    const userAttrs = {
                        name: faker.name.firstName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }
                    const extraAttrs = {
                        specializations: {
                            connect: [
                                { id: categoryClassifier1.id },
                                { id: categoryClassifier2.id },
                            ],
                        },
                    }
                    const client = await makeClientWithRegisteredOrganization()
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs, extraAttrs)

                    expect(employee.email).toEqual(userAttrs.email)
                    expect(employee.phone).toEqual(userAttrs.phone)
                    expect(employee.name).toEqual(userAttrs.name)
                    expect(employee.specializations).toHaveLength(2)
                    expect(employee.specializations).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining(pick(categoryClassifier1, ['id', 'name'])),
                        ])
                    )
                    expect(employee.specializations).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining(pick(categoryClassifier2, ['id', 'name'])),
                        ])
                    )
                })

                it('tries to find employee first by phone first', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const [categoryClassifier1] = await createTestTicketCategoryClassifier(admin)
                    const client = await makeClientWithRegisteredOrganization()
                    const client1 = await makeClientWithRegisteredOrganization()

                    const inviteClient = await makeClientWithRegisteredOrganization()

                    const userAttrs = {
                        name: client.userAttrs.name,
                        email: client1.userAttrs.email,
                        phone: client.userAttrs.phone,
                    }
                    const extraAttrs = {
                        specializations: {
                            connect: [
                                { id: categoryClassifier1.id },
                            ],
                        },
                    }
                    const [employee] = await inviteNewOrganizationEmployee(inviteClient, inviteClient.organization, userAttrs, extraAttrs)
                    expect(employee.email).toEqual(client1.userAttrs.email)
                    expect(employee.user.id).toEqual(client.user.id)
                    expect(employee.phone).toEqual(client.userAttrs.phone)
                    expect(employee.name).toEqual(client.userAttrs.name)
                })
            })

            describe('for already registered User', () => {
                test('creates OrganizationEmployee record for registered User and returns it', async () => {
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
            })

            describe('for already registered employee User by email', () => {
                it('finds it by email and returns', async () => {
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
            })

            describe('for Employee with duplicated phone', () => {
                it('throws ALREADY_EXISTS_ERROR', async () => {
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
            })

            describe('for Employee with duplicated email', () => {
                it('it throws ALREADY_EXISTS_ERROR', async () => {
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

            describe('for Employee with duplicated User', () => {
                it('tries to find user by phone, then by email)', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const [categoryClassifier1] = await createTestTicketCategoryClassifier(admin)
                    const client = await makeClientWithRegisteredOrganization()
                    const inviteClient = await makeClientWithRegisteredOrganization()

                    const userAttrs = {
                        name: client.userAttrs.name,
                        email: client.userAttrs.email,
                        phone: inviteClient.userAttrs.phone,
                    }
                    const extraAttrs = {
                        specializations: {
                            connect: [
                                { id: categoryClassifier1.id },
                            ],
                        },
                    }
                    const { errors } = await inviteNewOrganizationEmployee(inviteClient, inviteClient.organization, userAttrs, extraAttrs, { raw: true } )
                    expect(JSON.stringify(errors)).toContain(ALREADY_EXISTS_ERROR)
                })
            })
        })

        describe('called by Anonymous', () => {
            it('returns Authentication error', async () => {
                const anonymousClient = await makeClient()
                const client = await makeClientWithRegisteredOrganization()
                const admin = await makeLoggedInAdminClient()
                const [userAttrs] = await createTestUser(admin)
                const employeeUserAttrs = {
                    ...userAttrs,
                    email: createTestEmail(),
                    phone: createTestPhone(),
                }

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await inviteNewOrganizationEmployee(anonymousClient, client.organization, employeeUserAttrs, {}, { raw: true })
                })
            })
        })
    })

    describe('reInviteOrganizationEmployee', () => {
        describe('called by organization owner', () => {
            describe('for not registered User', () => {
                test('returns employee, already created after invitation', async () => {
                    const userAttrs = {
                        name: faker.name.firstName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }
                    const client = await makeClientWithRegisteredOrganization()
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)
                })
            })

            describe('for already registered User', () => {
                test('returns employee, already created after invitation', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const admin = await makeLoggedInAdminClient()
                    const [, userAttrs] = await createTestUser(admin)
                    const employeeUserAttrs = {
                        ...userAttrs,
                        email: createTestEmail(),
                    }

                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)
                })
            })

            describe('for already registered employee User by email', () => {
                it('finds it and returns', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const admin = await makeLoggedInAdminClient()
                    const [, userAttrs] = await createTestUser(admin)
                    const employeeUserAttrs = {
                        ...userAttrs,
                        phone: createTestPhone(),
                    }

                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)
                })
            })

            describe('for Employee with accepted invitation', () => {
                it('throws ALREADY_EXISTS_ERROR', async () => {
                    const client1 = await makeClientWithRegisteredOrganization()
                    const client2 = await makeClientWithNewRegisteredAndLoggedInUser()

                    const [employee] = await inviteNewOrganizationEmployee(client1, client1.organization, client2.userAttrs)
                    const [acceptedInvite] = await acceptOrRejectOrganizationInviteById(client2, employee)

                    expect(acceptedInvite).toEqual(expect.objectContaining({
                        isAccepted: true,
                        isRejected: false,
                    }))

                    const { errors } = await reInviteNewOrganizationEmployee(client1, client1.organization, employee, {}, { raw: true })

                    expect(JSON.stringify(errors)).toContain(ALREADY_EXISTS_ERROR)
                })
            })
        })

        describe('called by Anonymous', () => {
            it('throws Authentication error', async () => {
                const anonymousClient = await makeClient()
                const userAttrs = {
                    name: faker.name.firstName(),
                    email: createTestEmail(),
                    phone: createTestPhone(),
                }
                const client = await makeClientWithRegisteredOrganization()
                await inviteNewOrganizationEmployee(client, client.organization, userAttrs)
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await reInviteNewOrganizationEmployee(anonymousClient, client.organization, userAttrs)
                })
            })
        })
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
