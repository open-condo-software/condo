const faker = require('faker')
const { pick } = require('lodash')

const { makeLoggedInAdminClient, makeClient, UUID_RE } = require('@core/keystone/test.utils')

const { expectToThrowAuthenticationErrorToObj, catchErrorFrom } = require('@condo/domains/common/utils/testSchema')
const { sleep } = require('@condo/domains/common/utils/sleep')

const {
    DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
    MESSAGE_SENT_STATUS,
    EMAIL_TRANSPORT,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')

const {
    inviteNewOrganizationEmployee,
    reInviteNewOrganizationEmployee,
    makeClientWithRegisteredOrganization,
    acceptOrRejectOrganizationInviteById,
} = require('@condo/domains/organization/utils/testSchema/Organization')

const { createTestTicketCategoryClassifier } = require('@condo/domains/ticket/utils/testSchema')

const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { createTestUser, createTestPhone, createTestEmail } = require('@condo/domains/user/utils/testSchema')

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

                    /**
                     * Check that notification about invitation as employee was sent
                     */
                    const messageWhere = { user: { id: employee.user.id }, type: DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE }
                    const message = await Message.getOne(admin, messageWhere)

                    expect(message.id).toMatch(UUID_RE)

                    await sleep(1000)

                    const message1 = await Message.getOne(admin, messageWhere)

                    expect(message1.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(message1.processingMeta.transport).toEqual(EMAIL_TRANSPORT)
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
                it('throws error with type ALREADY_INVITED', async () => {
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

                    await catchErrorFrom(async () => {
                        await inviteNewOrganizationEmployee(client, client.organization, secondUserAttrs, {})
                    }, ({ errors }) => {
                        expect(errors).toMatchObject([{
                            message: 'Already invited into the organization',
                            path: ['obj'],
                            extensions: {
                                mutation: 'inviteNewOrganizationEmployee',
                                code: 'BAD_USER_INPUT',
                                type: 'ALREADY_INVITED',
                                message: 'Already invited into the organization',
                            },
                        }])
                    })
                })
            })

            describe('for Employee with duplicated email', () => {
                it('throws error with type ALREADY_INVITED', async () => {
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

                    await catchErrorFrom(async () => {
                        await inviteNewOrganizationEmployee(client, client.organization, secondUserAttrs, {})
                    }, ({ errors }) => {
                        expect(errors).toMatchObject([{
                            message: 'Already invited into the organization',
                            path: ['obj'],
                            extensions: {
                                mutation: 'inviteNewOrganizationEmployee',
                                code: 'BAD_USER_INPUT',
                                type: 'ALREADY_INVITED',
                                message: 'Already invited into the organization',
                            },
                        }])
                    })
                })
            })

            describe('for Employee with duplicated User', () => {
                it('throws error with type ALREADY_INVITED', async () => {
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
                    await catchErrorFrom(async () => {
                        await inviteNewOrganizationEmployee(inviteClient, inviteClient.organization, userAttrs, extraAttrs)
                    }, ({ errors }) => {
                        expect(errors).toMatchObject([{
                            message: 'Already invited into the organization',
                            path: ['obj'],
                            extensions: {
                                mutation: 'inviteNewOrganizationEmployee',
                                code: 'BAD_USER_INPUT',
                                type: 'ALREADY_INVITED',
                                message: 'Already invited into the organization',
                            },
                        }])
                    })
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
                    await inviteNewOrganizationEmployee(anonymousClient, client.organization, employeeUserAttrs, {})
                })
            })
        })
    })

    describe('reInviteOrganizationEmployee', () => {
        describe('called by organization owner', () => {
            describe('for not registered User', () => {
                test('returns employee, already created after invitation', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userAttrs = {
                        name: faker.name.firstName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }
                    const client = await makeClientWithRegisteredOrganization()
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)

                    /**
                     * Give worker task some time
                     */
                    await sleep(1000)

                    /**
                     * Check that notifications about invitation as employee were sent
                     */
                    const messageWhere = { user: { id: employee.user.id }, type: DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE }
                    const messages = await Message.getAll(admin, messageWhere)

                    expect(messages[0].status).toEqual(MESSAGE_SENT_STATUS)
                    expect(messages[0].processingMeta.transport).toEqual(EMAIL_TRANSPORT)
                    expect(messages[1].status).toEqual(MESSAGE_SENT_STATUS)
                    expect(messages[1].processingMeta.transport).toEqual(EMAIL_TRANSPORT)
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
                it('throws error with type ALREADY_ACCEPTED_INVITATION', async () => {
                    const client1 = await makeClientWithRegisteredOrganization()
                    const client2 = await makeClientWithNewRegisteredAndLoggedInUser()

                    const [employee] = await inviteNewOrganizationEmployee(client1, client1.organization, client2.userAttrs)
                    const [acceptedInvite] = await acceptOrRejectOrganizationInviteById(client2, employee)

                    expect(acceptedInvite).toEqual(expect.objectContaining({
                        isAccepted: true,
                        isRejected: false,
                    }))

                    await catchErrorFrom(async () => {
                        await reInviteNewOrganizationEmployee(client1, client1.organization, employee, {})
                    }, ({ errors }) => {
                        expect(errors).toMatchObject([{
                            message: 'Corresponding OrganizationEmployee has already accepted invitation',
                            path: ['obj'],
                            extensions: {
                                mutation: 'reInviteOrganizationEmployee',
                                code: 'BAD_USER_INPUT',
                                type: 'ALREADY_ACCEPTED_INVITATION',
                                message: 'Corresponding OrganizationEmployee has already accepted invitation',
                            },
                        }])
                    })
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
