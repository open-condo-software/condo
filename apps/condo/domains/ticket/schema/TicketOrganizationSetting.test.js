const { makeLoggedInAdminClient, makeClient } = require('@condo/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const { createTestTicketOrganizationSetting } = require('@condo/domains/ticket/utils/testSchema')
const { expectToThrowAccessDeniedErrorToObj,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
} = require('@condo/domains/common/utils/testSchema')
const { updateTestTicketOrganizationSetting, TicketOrganizationSetting } = require('@condo/domains/ticket/utils/testSchema')
const { TICKET_DEFAULT_DEADLINE_FIELDS } = require('@condo/domains/ticket/constants/common')

const EXPECTED_MIN_DEADLINE = 0
const EXPECTED_MAX_DEADLINE = 45
const EXPECTED_DEFAULT_DEADLINE = 8

describe('TicketOrganizationSetting', () => {
    describe('CRUD', () => {
        describe('User', () => {
            describe('Employee in organization', () => {
                test('can not create TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)
                    const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                    await createTestOrganizationEmployee(admin, organization, userClient.user, role)

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestTicketOrganizationSetting(userClient, organization)
                    })
                })
                test('can not delete TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)
                    const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                    await createTestOrganizationEmployee(admin, organization, userClient.user, role)

                    const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                        organization: { id: organization.id },
                    })

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await TicketOrganizationSetting.delete(userClient, setting.id)
                    })
                })
                test('can update TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)
                    const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                    await createTestOrganizationEmployee(admin, organization, userClient.user, role)

                    const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                        organization: { id: organization.id },
                    })

                    const [updatedSetting] = await updateTestTicketOrganizationSetting(userClient, setting.id, {})

                    expect(updatedSetting.id).toEqual(setting.id)
                    expect(updatedSetting.defaultDeadline).toEqual(setting.defaultDeadline)
                    expect(updatedSetting.paidDeadline).toEqual(setting.paidDeadline)
                    expect(updatedSetting.emergencyDeadline).toEqual(setting.emergencyDeadline)
                    expect(updatedSetting.warrantyDeadline).toEqual(setting.warrantyDeadline)
                })
                test('can read TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)
                    const [role] = await createTestOrganizationEmployeeRole(admin, organization)
                    await createTestOrganizationEmployee(admin, organization, userClient.user, role)

                    const [setting] = await TicketOrganizationSetting.getAll(userClient,  {
                        organization: { id: organization.id },
                    })

                    expect(setting.organization.id).toMatch(organization.id)
                    expect(setting.defaultDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
                    expect(setting.paidDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
                    expect(setting.emergencyDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
                    expect(setting.warrantyDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
                })
            })
            describe('No employee in organization', () => {
                test('can not create TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestTicketOrganizationSetting(userClient, organization)
                    })
                })
                test('can not delete TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)

                    const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                        organization: { id: organization.id },
                    })

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await TicketOrganizationSetting.delete(userClient, setting.id)
                    })
                })
                test('can not update TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)

                    const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                        organization: { id: organization.id },
                    })

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestTicketOrganizationSetting(userClient, setting.id, {})
                    })
                })
                test('can not read TicketOrganizationSetting', async () => {
                    const admin = await makeLoggedInAdminClient()
                    const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                    const [organization] = await createTestOrganization(admin)

                    const settings = await TicketOrganizationSetting.getAll(userClient,  {
                        organization: { id: organization.id },
                    })

                    expect(settings).toHaveLength(0)
                })
            })
        })
        describe('Admin', () => {
            test('can not  create TicketOrganizationSetting', async () => {
                const admin = await makeLoggedInAdminClient()
                const [organization] = await createTestOrganization(admin)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestTicketOrganizationSetting(admin, organization)
                })
            })
            test('can not  delete TicketOrganizationSetting', async () => {
                const admin = await makeLoggedInAdminClient()
                const [organization] = await createTestOrganization(admin)

                const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                    organization: { id: organization.id },
                })

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await TicketOrganizationSetting.delete(admin, setting.id)
                })
            })
            test('can update TicketOrganizationSetting', async () => {
                const admin = await makeLoggedInAdminClient()
                const [organization] = await createTestOrganization(admin)

                const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                    organization: { id: organization.id },
                })

                const [updatedSetting] = await updateTestTicketOrganizationSetting(admin, setting.id, {})

                expect(updatedSetting.id).toEqual(setting.id)
                expect(updatedSetting.defaultDeadline).toEqual(setting.defaultDeadline)
                expect(updatedSetting.paidDeadline).toEqual(setting.paidDeadline)
                expect(updatedSetting.emergencyDeadline).toEqual(setting.emergencyDeadline)
                expect(updatedSetting.warrantyDeadline).toEqual(setting.warrantyDeadline)
            })
            test('can read TicketOrganizationSetting', async () => {
                const admin = await makeLoggedInAdminClient()
                const [organization] = await createTestOrganization(admin)

                const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                    organization: { id: organization.id },
                })

                expect(setting.organization.id).toMatch(organization.id)
                expect(setting.defaultDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
                expect(setting.paidDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
                expect(setting.emergencyDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
                expect(setting.warrantyDeadline).toEqual(EXPECTED_DEFAULT_DEADLINE)
            })
        })
        describe('Anonymous', () => {
            test('can not create TicketOrganizationSetting', async () => {
                const anonymousClient = await makeClient()
                const admin = await makeLoggedInAdminClient()
                const [organization] = await createTestOrganization(admin)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestTicketOrganizationSetting(anonymousClient, organization)
                })
            })
            test('can not delete TicketOrganizationSetting', async () => {
                const admin = await makeLoggedInAdminClient()
                const anonymousClient = await makeClient()
                const [organization] = await createTestOrganization(admin)

                const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                    organization: { id: organization.id },
                })

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await TicketOrganizationSetting.delete(anonymousClient, setting.id)
                })
            })
            test('can not update TicketOrganizationSetting', async () => {
                const admin = await makeLoggedInAdminClient()
                const anonymousClient = await makeClient()
                const [organization] = await createTestOrganization(admin)

                const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                    organization: { id: organization.id },
                })

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestTicketOrganizationSetting(anonymousClient, setting.id, {})
                })
            })
            test('can not read TicketOrganizationSetting', async () => {
                const admin = await makeLoggedInAdminClient()
                const anonymousClient = await makeClient()
                const [organization] = await createTestOrganization(admin)

                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await TicketOrganizationSetting.getAll(anonymousClient,  {
                        organization: { id: organization.id },
                    })
                })
            })
        })
    })
    describe('Validations', () => {
        const cases = [...TICKET_DEFAULT_DEADLINE_FIELDS]
        test.each(cases)(`value of the %p field must be between values from ${EXPECTED_MIN_DEADLINE} to ${EXPECTED_MAX_DEADLINE} inclusive`, async (fieldPath) => {
            const admin = await makeLoggedInAdminClient()
            const [organization] = await createTestOrganization(admin)
            const [setting] = await TicketOrganizationSetting.getAll(admin,  {
                organization: { id: organization.id },
            })

            let payload = {
                [fieldPath]: EXPECTED_MIN_DEADLINE,
            }
            const [updatedSetting] = await updateTestTicketOrganizationSetting(admin, setting.id, payload)

            expect(updatedSetting.id).toEqual(setting.id)
            expect(updatedSetting[fieldPath]).toEqual(payload[fieldPath])

            payload = {
                [fieldPath]: EXPECTED_MAX_DEADLINE,
            }
            const [secondUpdatedSetting] = await updateTestTicketOrganizationSetting(admin, setting.id, payload)

            expect(secondUpdatedSetting.id).toEqual(setting.id)
            expect(secondUpdatedSetting[fieldPath]).toEqual(payload[fieldPath])
        })
    })
})
