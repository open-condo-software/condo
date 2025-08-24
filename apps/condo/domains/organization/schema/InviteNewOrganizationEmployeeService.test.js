const { faker } = require('@faker-js/faker')

const conf = require('@open-condo/config')
const {
    makeLoggedInAdminClient,
    makeClient,
    waitFor,
    expectToThrowAuthenticationErrorToObj,
    catchErrorFrom,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')

const {
    DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
    DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
    MESSAGE_SENT_STATUS,
    EMAIL_TRANSPORT,
    SMS_TRANSPORT,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { HOLDING_TYPE } = require('@condo/domains/organization/constants/common')
const {
    OrganizationEmployeeSpecialization,
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
    makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee,
    updateTestOrganization,
    Organization,
    OrganizationEmployeeRequest,
    sendOrganizationEmployeeRequestByTestClient,
    inviteNewOrganizationEmployee,
    reInviteNewOrganizationEmployee,
    makeClientWithRegisteredOrganization,
    acceptOrRejectOrganizationInviteById,
    acceptOrRejectOrganizationEmployeeRequestByTestClient,
} = require('@condo/domains/organization/utils/testSchema')
const { createTestTicketCategoryClassifier } = require('@condo/domains/ticket/utils/testSchema')
const { getIdentificationUserRequiredFields } = require('@condo/domains/user/utils/serverSchema/userHelpers')
const {
    makeClientWithNewRegisteredAndLoggedInUser,
    createTestUser,
    createTestPhone,
    createTestEmail,
    makeClientWithStaffUser,
} = require('@condo/domains/user/utils/testSchema')


describe('InviteNewOrganizationEmployeeService', () => {
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()

        if (!conf['CALLCENTER_DOMAIN']) {
            throw Error('You should run bin/prepare.js before executing this test suite')
        }
    })

    describe('inviteNewOrganizationEmployee', () => {
        describe('invite required fields', () => {
            /**
             * These tests depend on the .env variable INVITE_REQUIRED_FIELDS.
             * To check all cases, set the values one at a time: ["email"] / ["phone"] / ["email", "phone"].
             * In ci, it will work out the default ["phone"]
             */
            let scenario // phone / email / both
            const CASES = {
                email: {
                    name: 'only email required',
                    envValue: '["email"]',
                    expectedTransport: EMAIL_TRANSPORT,
                    expectedMsgType: DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
                    expectEmployeeAttrs: (employee, employeeUserAttrs) => {
                        expect(employee.email).toBe(employeeUserAttrs.email)
                        expect(employee.phone).toBeNull()
                    },
                    userAttrs: () => ({ name: faker.name.fullName(), email: createTestEmail() }),
                    error: {
                        message: 'Wrong email value',
                        path: ['obj'],
                        extensions: {
                            mutation: 'inviteNewOrganizationEmployee',
                            code: 'BAD_USER_INPUT',
                            type: 'WRONG_EMAIL_VALUE',
                            message: 'Wrong email value',
                        },
                    },
                },
                phone: {
                    name: 'only phone required (default)',
                    envValue: null,
                    expectedTransport: SMS_TRANSPORT,
                    expectedMsgType: DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
                    expectEmployeeAttrs: (employee, employeeUserAttrs) => {
                        expect(employee.phone).toBe(employeeUserAttrs.phone)
                        expect(employee.email).toBeNull()
                    },
                    userAttrs: () => ({ name: faker.name.fullName(), phone: createTestPhone() }),
                    error: {
                        message: 'Wrong phone format',
                        path: ['obj'],
                        extensions: {
                            mutation: 'inviteNewOrganizationEmployee',
                            code: 'BAD_USER_INPUT',
                            type: 'WRONG_PHONE_FORMAT',
                            message: 'Wrong phone format',
                        },
                    },
                },
                both: {
                    name: 'both required',
                    envValue: '["email","phone"]',
                    expectedTransport: EMAIL_TRANSPORT,
                    expectedMsgType: DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
                    expectEmployeeAttrs: (employee, employeeUserAttrs) => {
                        expect(employee.email).toBe(employeeUserAttrs.email)
                        expect(employee.phone).toBe(employeeUserAttrs.phone)
                    },
                    userAttrs: () => ({
                        name: faker.name.fullName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }),
                    error: {
                        message: 'Wrong phone format',
                        path: ['obj'],
                        extensions: {
                            mutation: 'inviteNewOrganizationEmployee',
                            code: 'BAD_USER_INPUT',
                            type: 'WRONG_PHONE_FORMAT',
                            message: 'Wrong phone format',
                        },
                    },
                },
            }

            beforeAll(() => {
                try {
                    const IDENTIFICATION_USER_REQUIRED_FIELDS = getIdentificationUserRequiredFields()
                    const INVITE_REQUIRED_FIELDS = conf['INVITE_REQUIRED_FIELDS']
                    const raw = INVITE_REQUIRED_FIELDS !== undefined ? INVITE_REQUIRED_FIELDS : IDENTIFICATION_USER_REQUIRED_FIELDS.staff
                    if (!raw) {
                        return scenario = CASES.phone
                    }

                    const fields = JSON.parse(raw)

                    if (fields.length === 2) {
                        return scenario = CASES.both
                    }

                    if (fields.length === 1 && fields[0] === 'email') {
                        return scenario = CASES.email
                    }

                    return scenario = CASES.phone
                } catch (error) {
                    return scenario = CASES.phone
                }
            })

            it('invites employee by specific transport depending on INVITE_REQUIRED_FIELDS', async () => {
                const client = await makeClientWithRegisteredOrganization()
                const [role] = await createTestOrganizationEmployeeRole(client, client.organization)

                const employeeUserAttrs = scenario.userAttrs()

                const [employee] = await inviteNewOrganizationEmployee(
                    client, client.organization, employeeUserAttrs, role,
                )

                scenario.expectEmployeeAttrs(employee, employeeUserAttrs)

                await waitFor(async () => {
                    const message = await Message.getOne(admin, {
                        user: { id: employee.user.id },
                        type: scenario.expectedMsgType,
                    })

                    expect(message.status).toBe(MESSAGE_SENT_STATUS)
                    expect(message.processingMeta.transportsMeta[0].transport).toBe(scenario.expectedTransport)
                })
            })

            it('throws error with  wrong format type if required values are not passed', async () => {
                const client = await makeClientWithRegisteredOrganization()
                const [role] = await createTestOrganizationEmployeeRole(client, client.organization)

                let employeeUserAttrs = { name: faker.name.fullName() }

                await catchErrorFrom(async () => {
                    await inviteNewOrganizationEmployee(
                        client, client.organization, employeeUserAttrs, role,
                    )
                }, ({ errors }) => {
                    expect(errors).toMatchObject([scenario.error])
                })
            })
        })

        describe('called by organization owner', () => {
            describe('for not registered User', () => {
                it('returns new employee with specified contacts and specializations', async () => {
                    const [categoryClassifier1] = await createTestTicketCategoryClassifier(admin)
                    const [categoryClassifier2] = await createTestTicketCategoryClassifier(admin)

                    const userAttrs = {
                        name: faker.name.firstName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }
                    const extraAttrs = {
                        specializations: [{ id: categoryClassifier1.id }, { id: categoryClassifier2.id }],
                    }
                    const client = await makeClientWithRegisteredOrganization()
                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs, role, extraAttrs)

                    expect(employee.email).toEqual(userAttrs.email)
                    expect(employee.phone).toEqual(userAttrs.phone)
                    expect(employee.name).toEqual(userAttrs.name)

                    const organizationEmployeeSpecializations = await OrganizationEmployeeSpecialization.getAll(admin, {
                        employee: { id: employee.id },
                    }, {
                        sortBy: 'createdAt_ASC',
                    })
                    expect(organizationEmployeeSpecializations).toHaveLength(2)
                    expect(organizationEmployeeSpecializations[0].specialization.id).toEqual(categoryClassifier1.id)
                    expect(organizationEmployeeSpecializations[1].specialization.id).toEqual(categoryClassifier2.id)

                    /**
                     * Check that notification about invitation as employee was sent
                     */
                    const messageWhere = {
                        user: { id: employee.user.id },
                        type: DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
                    }

                    await waitFor(async () => {
                        const message1 = await Message.getOne(admin, messageWhere)
                        const { transportsMeta } = message1.processingMeta

                        expect(message1.status).toEqual(MESSAGE_SENT_STATUS)
                        expect(transportsMeta[0].transport).toEqual(EMAIL_TRANSPORT)
                        expect(message1.organization.id).toEqual(client.organization.id)
                        expect(message1).toHaveProperty(['meta', 'serverUrl'], process.env.SERVER_URL)
                    })
                })

                it('tries to find employee first by phone first', async () => {
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
                        specializations: [{ id: categoryClassifier1.id }],
                    }
                    const [role] = await createTestOrganizationEmployeeRole(inviteClient, inviteClient.organization)
                    const [employee] = await inviteNewOrganizationEmployee(inviteClient, inviteClient.organization, userAttrs, role, extraAttrs)

                    expect(employee.email).toEqual(client1.userAttrs.email)
                    expect(employee.user.id).toEqual(client.user.id)
                    expect(employee.phone).toEqual(client.userAttrs.phone)
                    expect(employee.name).toEqual(client.userAttrs.name)
                })
            })

            describe('for already registered User', () => {
                test('creates OrganizationEmployee record for registered User and returns it', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const [obj, userAttrs] = await createTestUser(admin)
                    const employeeUserAttrs = {
                        ...userAttrs,
                        email: createTestEmail(),
                    }

                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs, role)

                    expect(employee.email).toEqual(employeeUserAttrs.email)
                    expect(employee.user.id).toEqual(obj.id)
                    expect(employee.phone).toEqual(employeeUserAttrs.phone)
                    expect(employee.name).toEqual(employeeUserAttrs.name)
                })
            })

            describe('for already registered employee User by email', () => {
                it('finds it by email and returns', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const [obj, userAttrs] = await createTestUser(admin)
                    const employeeUserAttrs = {
                        ...userAttrs,
                        phone: createTestPhone(),
                    }

                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs, role)

                    expect(employee.email).toEqual(employeeUserAttrs.email)
                    expect(employee.user.id).toEqual(obj.id)
                    expect(employee.phone).toEqual(employeeUserAttrs.phone)
                    expect(employee.name).toEqual(employeeUserAttrs.name)
                })
            })

            describe('for Employee with duplicated data', () => {
                it('throws error with type ALREADY_INVITED_EMAIL if email duplicated', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const userAttrs = {
                        name: faker.name.firstName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }

                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    await inviteNewOrganizationEmployee(client, client.organization, userAttrs, role)
                    const secondUserAttrs = {
                        ...userAttrs,
                        phone: createTestPhone(),
                    }

                    // TODO(pahaz): DOMA-10368 use expectToThrowGQLError
                    await catchErrorFrom(async () => {
                        await inviteNewOrganizationEmployee(client, client.organization, secondUserAttrs, role)
                    }, ({ errors }) => {
                        expect(errors).toMatchObject([{
                            message: 'Employee with same email already invited into the organization',
                            path: ['obj'],
                            extensions: {
                                mutation: 'inviteNewOrganizationEmployee',
                                code: 'BAD_USER_INPUT',
                                type: 'ALREADY_INVITED_EMAIL',
                                message: 'Employee with same email already invited into the organization',
                            },
                        }])
                    })
                })

                it('throws error with type ALREADY_INVITED_PHONE if phone duplicated', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const userAttrs = {
                        name: faker.name.firstName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }

                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    await inviteNewOrganizationEmployee(client, client.organization, userAttrs, role)
                    const secondUserAttrs = {
                        ...userAttrs,
                        email: createTestEmail(),
                    }

                    // TODO(pahaz): DOMA-10368 use expectToThrowGQLError
                    await catchErrorFrom(async () => {
                        await inviteNewOrganizationEmployee(client, client.organization, secondUserAttrs, role)
                    }, ({ errors }) => {
                        expect(errors).toMatchObject([{
                            message: 'Employee with same phone already invited into the organization',
                            path: ['obj'],
                            extensions: {
                                mutation: 'inviteNewOrganizationEmployee',
                                code: 'BAD_USER_INPUT',
                                type: 'ALREADY_INVITED_PHONE',
                                message: 'Employee with same phone already invited into the organization',
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
                const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                const [userAttrs] = await createTestUser(admin)
                const employeeUserAttrs = {
                    ...userAttrs,
                    email: createTestEmail(),
                    phone: createTestPhone(),
                }

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await inviteNewOrganizationEmployee(anonymousClient, client.organization, employeeUserAttrs, role, {})
                })
            })
        })

        describe('called by employee', () => {
            describe('with granted "canInviteNewOrganizationEmployees" permission', () => {
                it('returns new employee', async () => {
                    const [organization] = await createTestOrganization(admin)
                    const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                        canInviteNewOrganizationEmployees: true,
                    })
                    const client = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [employee] = await createTestOrganizationEmployee(admin, organization, client.user, role)

                    const employeeUserAttrs = {
                        name: faker.name.fullName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }

                    const [invitedEmployee] = await inviteNewOrganizationEmployee(client, employee.organization, employeeUserAttrs, role)

                    expect(invitedEmployee.email).toEqual(employeeUserAttrs.email)
                    expect(invitedEmployee.phone).toEqual(employeeUserAttrs.phone)
                    expect(invitedEmployee.name).toEqual(employeeUserAttrs.name)
                })
            })

            describe('without granted "canInviteNewOrganizationEmployees" permission', () => {
                it('throws denied error', async () => {
                    const client = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)

                    const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                        canInviteNewOrganizationEmployees: false,
                    })
                    const [employee] = await createTestOrganizationEmployee(admin, organization, client.user, role)
                    const employeeUserAttrs = {
                        name: faker.name.fullName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await inviteNewOrganizationEmployee(client, employee.organization, employeeUserAttrs, role)
                    })
                })
            })

            describe('from another organization', () => {
                it('throws denied error', async () => {
                    const { organization, role } = await makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee()
                    const { userClient: clientFromOtherO10n } = await makeAdminClientWithRegisteredOrganizationWithRoleWithEmployee()

                    const newEmployeeUserAttrs = {
                        name: faker.name.fullName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await inviteNewOrganizationEmployee(clientFromOtherO10n, organization, newEmployeeUserAttrs, role)
                    })
                })
            })
        })

        describe('notifications (ADR-7 checks)', () => {
            let categoryClassifier1, categoryClassifier2

            beforeAll(async () => {
                const categoryClassifiers1 = await createTestTicketCategoryClassifier(admin)
                const categoryClassifiers2 = await createTestTicketCategoryClassifier(admin)

                categoryClassifier1 = categoryClassifiers1[0]
                categoryClassifier2 = categoryClassifiers2[0]
            })

            it('sends email when email address provided', async () => {
                const [, userAttrs] = await createTestUser(admin)
                const employeeUserAttrs = {
                    ...userAttrs,
                    email: createTestEmail(),
                }
                const extraAttrs = { specializations: [{ id: categoryClassifier1.id }, { id: categoryClassifier2.id }] }
                const client = await makeClientWithRegisteredOrganization()
                const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs, role, extraAttrs)

                expect(employee.email).toEqual(employeeUserAttrs.email)
                expect(employee.phone).toEqual(userAttrs.phone)
                expect(employee.name).toEqual(userAttrs.name)

                const employeeSpecializationWhere = { employee: { id: employee.id } }
                const employeeSpecializationSort = { sortBy: 'createdAt_ASC' }
                const organizationEmployeeSpecializations = await OrganizationEmployeeSpecialization.getAll(admin, employeeSpecializationWhere, employeeSpecializationSort)

                expect(organizationEmployeeSpecializations).toHaveLength(2)
                expect(organizationEmployeeSpecializations[0].specialization.id).toEqual(categoryClassifier1.id)
                expect(organizationEmployeeSpecializations[1].specialization.id).toEqual(categoryClassifier2.id)

                /**
                 * Check that notification about invitation as employee was sent
                 */
                const messageWhere = {
                    user: { id: employee.user.id },
                    type: DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
                }

                await waitFor(async () => {
                    const message1 = await Message.getOne(admin, messageWhere)
                    const { transportsMeta } = message1.processingMeta

                    expect(message1.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportsMeta[0].transport).toEqual(EMAIL_TRANSPORT)
                    expect(message1.organization.id).toEqual(client.organization.id)
                    expect(message1.email).toEqual(employeeUserAttrs.email)
                })
            })


            it('sends email when email address is skipped', async () => {
                const [, userAttrs] = await createTestUser(admin)
                const employeeUserAttrs = {
                    name: userAttrs.name,
                    phone: userAttrs.phone,
                }
                const extraAttrs = { specializations: [{ id: categoryClassifier1.id }, { id: categoryClassifier2.id }] }
                const client = await makeClientWithRegisteredOrganization()
                const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs, role, extraAttrs)

                expect(employee.email).toBeNull()
                expect(employee.phone).toEqual(userAttrs.phone)
                expect(employee.name).toEqual(userAttrs.name)

                const employeeSpecializationWhere = { employee: { id: employee.id } }
                const employeeSpecializationSort = { sortBy: 'createdAt_ASC' }
                const organizationEmployeeSpecializations = await OrganizationEmployeeSpecialization.getAll(admin, employeeSpecializationWhere, employeeSpecializationSort)

                expect(organizationEmployeeSpecializations).toHaveLength(2)
                expect(organizationEmployeeSpecializations[0].specialization.id).toEqual(categoryClassifier1.id)
                expect(organizationEmployeeSpecializations[1].specialization.id).toEqual(categoryClassifier2.id)

                /**
                 * Check that notification about invitation as employee was sent
                 */
                const messageWhere = {
                    user: { id: employee.user.id },
                    type: DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
                }

                await waitFor(async () => {
                    const message1 = await Message.getOne(admin, messageWhere)
                    const { transportsMeta } = message1.processingMeta

                    expect(message1.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportsMeta[0].transport).toEqual(SMS_TRANSPORT)
                    expect(message1.organization.id).toEqual(client.organization.id)
                    expect(message1.phone).toEqual(userAttrs.phone)
                })
            })

        })

        describe('for organization with holding type', () => {
            it('should send message with special serverUrl from env (CALLCENTER_DOMAIN)', async () => {
                const userAttrs = {
                    name: faker.name.firstName(),
                    email: createTestEmail(),
                    phone: createTestPhone(),
                }

                const client = await makeClientWithRegisteredOrganization()
                await updateTestOrganization(admin, client.organization.id, {
                    type: HOLDING_TYPE,
                })

                const organization = await Organization.getOne(admin, { id: client.organization.id })
                expect(organization).toHaveProperty('type', HOLDING_TYPE)

                const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs, role)

                const messageWhere = {
                    user: { id: employee.user.id },
                    type: DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
                }

                await waitFor(async () => {
                    const message = await Message.getOne(admin, messageWhere)
                    const { transportsMeta } = message.processingMeta

                    expect(message.status).toEqual(MESSAGE_SENT_STATUS)
                    expect(transportsMeta[0].transport).toEqual(EMAIL_TRANSPORT)
                    expect(message.organization.id).toEqual(client.organization.id)
                    expect(message).toHaveProperty(['meta', 'serverUrl'], conf.CALLCENTER_DOMAIN)
                })
            })
        })

        describe('organization employee request', () => {
            it('should be automatically accepted along with the invitation if exists and not processed', async () => {
                const employeeClient = await makeClientWithRegisteredOrganization()
                const staffClient = await makeClientWithStaffUser()
                const userAttrs = {
                    name: staffClient.userAttrs.name,
                    email: staffClient.userAttrs.email,
                    phone: staffClient.userAttrs.phone,
                }

                const [createdRequest] = await sendOrganizationEmployeeRequestByTestClient(staffClient, {
                    organization: { id: employeeClient.organization.id },
                })
                expect(createdRequest.user.id).toBe(staffClient.user.id)
                expect(createdRequest.organizationId).toBe(employeeClient.organization.id)
                expect(createdRequest.isAccepted).toBeFalsy()
                expect(createdRequest.isRejected).toBeFalsy()
                expect(createdRequest.processedBy).toBeNull()
                expect(createdRequest.v).toBe(1)

                const [role] = await createTestOrganizationEmployeeRole(employeeClient, employeeClient.organization)
                const [employee] = await inviteNewOrganizationEmployee(employeeClient, employeeClient.organization, userAttrs, role)

                expect(employee.user.id).toBe(staffClient.user.id)
                expect(employee.name).toBe(staffClient.userAttrs.name)
                expect(employee.phone).toBe(staffClient.userAttrs.phone)
                expect(employee.email).toBe(staffClient.userAttrs.email)
                expect(employee.isAccepted).toBeTruthy()
                expect(employee.isRejected).toBeFalsy()

                const request = await OrganizationEmployeeRequest.getOne(admin, {
                    organization: { id: employeeClient.organization.id },
                    user: { id: staffClient.user.id },
                    deletedAt: null,
                })

                expect(request.user.id).toBe(staffClient.user.id)
                expect(request.organization.id).toBe(employeeClient.organization.id)
                expect(request.isAccepted).toBeTruthy()
                expect(request.isRejected).toBeFalsy()
                expect(request.processedBy.id).toBe(employeeClient.user.id)
                expect(request.v).toBe(2)
            })

            it('should not be automatically accepted along with the invitation if exists and processed', async () => {
                const employeeClient = await makeClientWithRegisteredOrganization()
                const staffClient = await makeClientWithStaffUser()
                const userAttrs = {
                    name: staffClient.userAttrs.name,
                    email: staffClient.userAttrs.email,
                    phone: staffClient.userAttrs.phone,
                }

                const [createdRequest] = await sendOrganizationEmployeeRequestByTestClient(staffClient, {
                    organization: { id: employeeClient.organization.id },
                })
                expect(createdRequest.user.id).toBe(staffClient.user.id)
                expect(createdRequest.organizationId).toBe(employeeClient.organization.id)
                expect(createdRequest.isAccepted).toBeFalsy()
                expect(createdRequest.isRejected).toBeFalsy()
                expect(createdRequest.processedBy).toBeNull()
                expect(createdRequest.v).toBe(1)

                const [rejectedRequest] = await acceptOrRejectOrganizationEmployeeRequestByTestClient(employeeClient, {
                    employeeRequest: { id: createdRequest.id },
                    isRejected: true,
                })
                expect(rejectedRequest.isRejected).toBeTruthy()

                const [role] = await createTestOrganizationEmployeeRole(employeeClient, employeeClient.organization)
                const [employee] = await inviteNewOrganizationEmployee(employeeClient, employeeClient.organization, userAttrs, role)

                expect(employee.user.id).toBe(staffClient.user.id)
                expect(employee.name).toBe(staffClient.userAttrs.name)
                expect(employee.phone).toBe(staffClient.userAttrs.phone)
                expect(employee.email).toBe(staffClient.userAttrs.email)
                expect(employee.isAccepted).toBeFalsy()
                expect(employee.isRejected).toBeFalsy()

                const request = await OrganizationEmployeeRequest.getOne(admin, {
                    organization: { id: employeeClient.organization.id },
                    user: { id: staffClient.user.id },
                    deletedAt: null,
                })
                expect(request.isRejected).toBeTruthy()
                expect(request.isAccepted).toBeFalsy()
                expect(request.processedBy.id).toBe(employeeClient.user.id)
                expect(request.v).toBe(2)
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
                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs, role)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)

                    await waitFor(async () => {
                        /**
                         * Check that notifications about invitation as employee were sent
                         */
                        const messageWhere = {
                            user: { id: employee.user.id },
                            type: DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
                        }
                        const messages = await Message.getAll(admin, messageWhere)

                        expect(messages[0].status).toEqual(MESSAGE_SENT_STATUS)
                        expect(messages[0].processingMeta.transportsMeta[0].transport).toEqual(EMAIL_TRANSPORT)
                        expect(messages[1].status).toEqual(MESSAGE_SENT_STATUS)
                        expect(messages[1].processingMeta.transportsMeta[0].transport).toEqual(EMAIL_TRANSPORT)
                        expect(messages[1].organization.id).toEqual(client.organization.id)
                    })
                })
            })

            describe('for already registered User', () => {
                test('returns employee, already created after invitation', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const [, userAttrs] = await createTestUser(admin)
                    const employeeUserAttrs = {
                        ...userAttrs,
                        email: createTestEmail(),
                    }
                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs, role)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)
                })
            })

            describe('for already registered employee User by email', () => {
                it('finds it and returns', async () => {
                    const client = await makeClientWithRegisteredOrganization()
                    const [, userAttrs] = await createTestUser(admin)
                    const employeeUserAttrs = {
                        ...userAttrs,
                        phone: createTestPhone(),
                    }
                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, employeeUserAttrs, role)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)
                })
            })

            describe('for Employee with accepted invitation', () => {
                it('throws error with type ALREADY_ACCEPTED_INVITATION', async () => {
                    const client1 = await makeClientWithRegisteredOrganization()
                    const client2 = await makeClientWithNewRegisteredAndLoggedInUser()

                    const [role] = await createTestOrganizationEmployeeRole(client1, client1.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client1, client1.organization, client2.userAttrs, role)
                    const [acceptedInvite] = await acceptOrRejectOrganizationInviteById(client2, employee)

                    expect(acceptedInvite).toEqual(expect.objectContaining({
                        isAccepted: true,
                        isRejected: false,
                    }))

                    // TODO(pahaz): DOMA-10368 use expectToThrowGQLError
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

            describe('for organization with holding type', () => {
                it('should send message with special serverUrl from env (CALLCENTER_DOMAIN)', async () => {
                    const userAttrs = {
                        name: faker.name.firstName(),
                        email: createTestEmail(),
                        phone: createTestPhone(),
                    }
                    const client = await makeClientWithRegisteredOrganization()
                    await updateTestOrganization(admin, client.organization.id, {
                        type: HOLDING_TYPE,
                    })
                    const organization = await Organization.getOne(admin, { id: client.organization.id })

                    expect(organization).toHaveProperty('type', HOLDING_TYPE)

                    const [role] = await createTestOrganizationEmployeeRole(client, client.organization)
                    const [employee] = await inviteNewOrganizationEmployee(client, client.organization, userAttrs, role)
                    const [reInvitedEmployee] = await reInviteNewOrganizationEmployee(client, client.organization, userAttrs)

                    expect(reInvitedEmployee.id).toStrictEqual(employee.id)

                    await waitFor(async () => {
                        /**
                         * Check that notifications about invitation as employee were sent
                         */
                        const messageWhere = {
                            user: { id: employee.user.id },
                            type: DIRTY_INVITE_NEW_EMPLOYEE_EMAIL_MESSAGE_TYPE,
                        }
                        const messages = await Message.getAll(admin, messageWhere)

                        expect(messages[0].status).toEqual(MESSAGE_SENT_STATUS)
                        expect(messages[0]).toHaveProperty(['meta', 'serverUrl'], conf.CALLCENTER_DOMAIN)
                        expect(messages[0].processingMeta.transportsMeta[0].transport).toEqual(EMAIL_TRANSPORT)
                        expect(messages[1].status).toEqual(MESSAGE_SENT_STATUS)
                        expect(messages[1].processingMeta.transportsMeta[0].transport).toEqual(EMAIL_TRANSPORT)
                        expect(messages[1]).toHaveProperty(['meta', 'serverUrl'], conf.CALLCENTER_DOMAIN)
                        expect(messages[1].organization.id).toEqual(client.organization.id)
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
                const [role] = await createTestOrganizationEmployeeRole(client, client.organization)

                await inviteNewOrganizationEmployee(client, client.organization, userAttrs, role)
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await reInviteNewOrganizationEmployee(anonymousClient, client.organization, userAttrs)
                })
            })
        })
    })
})
