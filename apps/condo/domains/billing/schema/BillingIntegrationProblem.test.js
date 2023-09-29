const { faker } = require('@faker-js/faker')

const { makeLoggedInAdminClient, makeClient, waitFor } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowGraphQLRequestError,
} = require('@open-condo/keystone/test.utils')

const { makeOrganizationIntegrationManager } = require('@condo/domains/billing/utils/testSchema')
const {
    createTestBillingIntegrationOrganizationContext,
    updateTestBillingIntegrationOrganizationContext,
    createTestBillingIntegrationAccessRight,
    createTestBillingIntegration,
    createTestBillingIntegrationProblem,
    updateTestBillingIntegrationProblem,
    BillingIntegrationProblem,
    BillingIntegrationOrganizationContext,
} = require('@condo/domains/billing/utils/testSchema')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { makeEmployeeUserClientWithAbilities } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithServiceUser, makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')


describe('BillingIntegrationProblem', () => {
    let admin
    let support
    let serviceUser
    let noRightsServiceUser
    let manager
    let employee
    let user
    let anonymous
    let context
    let anotherContext
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        employee = await makeEmployeeUserClientWithAbilities({ canReadBillingReceipts: true })

        const [billing] = await createTestBillingIntegration(admin);
        [context] = await createTestBillingIntegrationOrganizationContext(admin, employee.organization, billing)
        const { managerUserClient }  = await makeOrganizationIntegrationManager(context)
        manager = managerUserClient
        serviceUser = await makeClientWithServiceUser()
        await createTestBillingIntegrationAccessRight(admin, billing, serviceUser.user)

        noRightsServiceUser = await makeClientWithServiceUser()
        const [anotherBilling] = await createTestBillingIntegration(admin)
        user = await makeEmployeeUserClientWithAbilities({ canReadBillingReceipts: true, canManageIntegrations: true });
        [anotherContext] = await createTestBillingIntegrationOrganizationContext(admin, user.organization, anotherBilling)
        await createTestBillingIntegrationAccessRight(admin, anotherBilling, noRightsServiceUser.user)

        anonymous = await makeClient()
    })
    describe('CRUD', () => {
        afterAll( () => {
            if (global.gc) {
                global.gc()
            }
        })
        describe('Create', () => {
            test('Admin can', async () => {
                const [problem] = await createTestBillingIntegrationProblem(admin, context)
                expect(problem).toBeDefined()
            })
            test('Support cannot', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestBillingIntegrationProblem(support, context)
                })
            })
            describe('Service user', () => {
                test('can with access rights', async () => {
                    const [problem] = await createTestBillingIntegrationProblem(serviceUser, context)
                    expect(problem).toBeDefined()
                })
                test('cannot otherwise', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestBillingIntegrationProblem(noRightsServiceUser, context)
                    })
                })
            })
            describe('Employee cannot', () => {
                test('Manager (canManageIntegrations = true)', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestBillingIntegrationProblem(manager, context)
                    })
                })
                test('Employee (canReadBillingReceipts = true)', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestBillingIntegrationProblem(employee, context)
                    })
                })
                test('User from another org', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestBillingIntegrationProblem(user, context)
                    })
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestBillingIntegrationProblem(anonymous, context)
                })
            })
        })
        describe('Update', () => {
            let problemToUpdate
            beforeAll(async () => {
                [problemToUpdate] = await createTestBillingIntegrationProblem(admin, context)
            })
            test('Admin can', async () => {
                const message = faker.lorem.sentences(3)
                const [updatedProblem] = await updateTestBillingIntegrationProblem(admin, problemToUpdate.id, { message })
                expect(updatedProblem).toEqual(expect.objectContaining({ message }))
            })
            test('Support cannot', async () => {
                const message = faker.lorem.sentences(3)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestBillingIntegrationProblem(support, problemToUpdate.id, { message })
                })
            })
            describe('Service user', () => {
                test('can with access rights', async () => {
                    const message = faker.lorem.sentences(3)
                    const [updatedProblem] = await updateTestBillingIntegrationProblem(serviceUser, problemToUpdate.id, { message })
                    expect(updatedProblem).toEqual(expect.objectContaining({ message }))
                })
                test('cannot otherwise', async () => {
                    const message = faker.lorem.sentences(3)
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestBillingIntegrationProblem(noRightsServiceUser, problemToUpdate.id, { message })
                    })
                })
            })
            describe('Employee cannot', () => {
                test('Manager (canManageIntegrations = true)', async () => {
                    const message = faker.lorem.sentences(3)
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestBillingIntegrationProblem(manager, problemToUpdate.id, { message })
                    })
                })
                test('Employee (canReadBillingReceipts = true)', async () => {
                    const message = faker.lorem.sentences(3)
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestBillingIntegrationProblem(employee, problemToUpdate.id, { message })
                    })
                })
                test('User from another org', async () => {
                    const message = faker.lorem.sentences(3)
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestBillingIntegrationProblem(user, problemToUpdate.id, { message })
                    })
                })
            })
            test('Anonymous cannot', async () => {
                const message = faker.lorem.sentences(3)
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestBillingIntegrationProblem(anonymous, problemToUpdate.id, { message })
                })
            })
        })
        describe('Read', () => {
            let problemToRead
            beforeAll(async () => {
                [problemToRead] = await createTestBillingIntegrationProblem(admin, context)
            })
            test('Admin can', async () => {
                const problems = await BillingIntegrationProblem.getAll(admin, { id: problemToRead.id })
                expect(problems).toEqual([expect.objectContaining({ id: problemToRead.id })])
            })
            test('Support can', async () => {
                const problems = await BillingIntegrationProblem.getAll(support, { id: problemToRead.id })
                expect(problems).toEqual([expect.objectContaining({ id: problemToRead.id })])
            })
            describe('Service user', () => {
                test('can with access rights', async () => {
                    const problems = await BillingIntegrationProblem.getAll(serviceUser, { id: problemToRead.id })
                    expect(problems).toEqual([expect.objectContaining({ id: problemToRead.id })])
                })
                test('cannot otherwise', async () => {
                    const problems = await BillingIntegrationProblem.getAll(noRightsServiceUser, { id: problemToRead.id })
                    expect(problems).toHaveLength(0)
                })
            })
            describe('Employee', () => {
                test('Manager (canManageIntegrations = true) can', async () => {
                    const problems = await BillingIntegrationProblem.getAll(manager, { id: problemToRead.id })
                    expect(problems).toHaveLength(1)
                    expect(problems).toEqual([expect.objectContaining({ id: problemToRead.id })])
                })
                test('Employee (canReadBillingReceipts = true)', async () => {
                    const problems = await BillingIntegrationProblem.getAll(employee, { id: problemToRead.id })
                    expect(problems).toEqual([expect.objectContaining({ id: problemToRead.id })])
                })
                test('User from another org cannot', async () => {
                    const problems = await BillingIntegrationProblem.getAll(user, { id: problemToRead.id })
                    expect(problems).toHaveLength(0)
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await BillingIntegrationProblem.getAll(anonymous, { id: problemToRead.id })
                })
            })
        })
        describe('Hard-delete', () => {
            test('Nobody can', async () => {
                const [problem] = await createTestBillingIntegrationProblem(admin, context)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(admin, problem.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(support, problem.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(serviceUser, problem.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(noRightsServiceUser, problem.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(manager, problem.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(employee, problem.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(user, problem.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await BillingIntegrationProblem.delete(anonymous, problem.id)
                })
            })
        })
    })
    describe('Validations', () => {
        test('Context field cannot be changed', async () => {
            const [problem] = await createTestBillingIntegrationProblem(admin, context)
            await expectToThrowGraphQLRequestError(async () => {
                await updateTestBillingIntegrationProblem(admin, problem.id, {
                    context: { connect: { id: anotherContext.id } },
                })
            }, 'Field "context" is not defined')
        })
        test('"currentProblem" of context updated on problem creation, can be resolved and cannot be set manually', async () => {
            const newEmployee = await makeEmployeeUserClientWithAbilities({ canReadBillingReceipts: true, canManageIntegrations: true })
            const newServiceUser = await makeClientWithServiceUser()
            const [newBilling] = await createTestBillingIntegration(admin)
            await createTestBillingIntegrationAccessRight(admin, newBilling, newServiceUser.user)

            const [newContext] = await createTestBillingIntegrationOrganizationContext(newEmployee, newEmployee.organization, newBilling, {
                status: CONTEXT_FINISHED_STATUS,
            })
            expect(newContext).toHaveProperty('currentProblem', null)

            const problemPayload = {
                title: faker.lorem.sentence(3),
                message: faker.lorem.sentences(3),
            }
            const [problem] = await createTestBillingIntegrationProblem(newServiceUser, newContext, problemPayload)

            await waitFor(async () => {
                const updatedContext = await BillingIntegrationOrganizationContext.getOne(newEmployee, { id: newContext.id })
                expect(updatedContext).toHaveProperty('currentProblem')
                expect(updatedContext.currentProblem).toEqual(expect.objectContaining({
                    id: problem.id,
                    ...problemPayload,
                }))
            })

            const [resolvedContext] = await updateTestBillingIntegrationOrganizationContext(support, newContext.id, {
                currentProblem: { disconnectAll: true },
            })
            expect(resolvedContext).toHaveProperty('currentProblem', null)

            await expectToThrowAccessDeniedErrorToObj(async () => {
                await updateTestBillingIntegrationOrganizationContext(support, newContext.id, {
                    currentProblem: { connect: { id: problem.id } },
                })
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await updateTestBillingIntegrationOrganizationContext(newServiceUser, newContext.id, {
                    currentProblem: { connect: { id: problem.id } },
                })
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await updateTestBillingIntegrationOrganizationContext(admin, newContext.id, {
                    currentProblem: { connect: { id: problem.id } },
                })
            })
        })
    })
})

