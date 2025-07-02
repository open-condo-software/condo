const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    makeClient,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    catchErrorFrom,
} = require('@open-condo/keystone/test.utils')

const {
    User,
    createTestUser,
    updateTestUser,
    createTestPhone,
    makeLoggedInAdminClient,
    makeLoggedInSupportClient,
    makeRegisteredAndLoggedInUser,
} = require('@dev-portal-api/domains/user/utils/testSchema')

describe('User', () => {
    let admin
    let support
    let user
    let anonymous
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        anonymous = await makeClient()
        user = await makeRegisteredAndLoggedInUser()
        support = await makeLoggedInSupportClient()
    })

    describe('CRUD operations', () => {
        describe('Create', () => {
            describe('User cannot be created directly', () => {
                test('Admin cannot', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestUser(admin)
                    })
                })
                test('Support cannot', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestUser(support)
                    })
                })
                test('User cannot', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestUser(user)
                    })
                })
                test('Anonymous cannot', async () => {
                    await expectToThrowAuthenticationErrorToObj(async () => {
                        await createTestUser(anonymous)
                    })
                })
            })
        })
        describe('Read', () => {
            let anotherUser
            beforeAll(async () => {
                anotherUser = await makeRegisteredAndLoggedInUser()
            })
            test('Admin can', async () => {
                const readUser = await User.getOne(admin, { id: anotherUser.user.id })
                expect(readUser).toHaveProperty('id')
            })
            test('Support can', async () => {
                const readUser = await User.getOne(support, { id: anotherUser.user.id })
                expect(readUser).toHaveProperty('id')
            })
            describe('User can', () => {
                test('Self with sensitive fields', async () => {
                    const readUser = await User.getOne(user, { id: user.user.id })
                    expect(readUser).toHaveProperty('id')
                    expect(readUser.phone).not.toBeNull()
                    expect(readUser.user).not.toBeNull()
                })
                test('No access to sensitive fields of others', async () => {
                    // TODO(pahaz): DOMA-10368 use expectToThrow AccessDenied
                    await catchErrorFrom(async () => {
                        await User.getOne(user, { id: anotherUser.user.id })
                    }, ({ errors, data }) => {
                        expect(data.objs).toHaveLength(1)
                        const readUser = data.objs[0]
                        expect(readUser.name).toBeNull()
                        expect(readUser.isAdmin).not.toBeNull()
                        expect(readUser.isSupport).not.toBeNull()
                        expect(readUser.id).not.toBeNull()
                        expect(readUser.phone).toBeNull()


                        expect(errors).toEqual(expect.objectContaining([
                            expect.objectContaining({ name: 'AccessDeniedError' }),
                        ]))
                    })
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await User.getAll(anonymous, {})
                })
            })
        })
        describe('Update', () => {
            let userToUpdate
            beforeEach(async () => {
                userToUpdate = await makeRegisteredAndLoggedInUser()
            })
            test('Admin can update anything except phone and password, and also delete users', async () => {
                const name = faker.internet.userName()
                const [updatedUser] = await updateTestUser(admin, userToUpdate.user.id, {
                    name,
                    isSupport: true,
                    isAdmin: true,
                })
                expect(updatedUser).toHaveProperty('name', name)
                expect(updatedUser).toHaveProperty('isSupport', true)
                expect(updatedUser).toHaveProperty('isAdmin', true)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestUser(admin, userToUpdate.user.id, {
                        password: faker.internet.password(),
                    })
                })
                // TODO(pahaz): DOMA-10368 use expectToThrowGraphQLRequestError
                await catchErrorFrom(async () => {
                    await updateTestUser(admin, userToUpdate.user.id, {
                        phone: createTestPhone(),
                    })
                }, ({ errors }) => {
                    expect(errors).toHaveLength(1)
                    expect(errors[0].message).toContain('Field "phone" is not defined by type "UserUpdateInput"')
                })

                const [deletedUser] = await updateTestUser(admin, userToUpdate.user.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedUser).toHaveProperty('deletedAt')
                expect(deletedUser.deletedAt).not.toBeNull()
            })
            test('Support can update anything except phone, password and accesses, and also delete users', async () => {
                const name = faker.internet.userName()
                const [updatedUser] = await updateTestUser(support, userToUpdate.user.id, {
                    name,
                })
                expect(updatedUser).toHaveProperty('name', name)
                const accessDeniedPayloads = [
                    { password: faker.internet.password() },
                    { isSupport: true },
                    { isAdmin: true },
                ]
                for (const payload of accessDeniedPayloads) {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestUser(support, userToUpdate.user.id, payload)
                    })
                }

                // TODO(pahaz): DOMA-10368 use expectToThrowGraphQLRequestError
                await catchErrorFrom(async () => {
                    await updateTestUser(support, userToUpdate.user.id, {
                        phone: createTestPhone(),
                    })
                }, ({ errors }) => {
                    expect(errors).toHaveLength(1)
                    expect(errors[0].message).toContain('Field "phone" is not defined by type "UserUpdateInput"')
                })

                const [deletedUser] = await updateTestUser(admin, userToUpdate.user.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedUser).toHaveProperty('deletedAt')
                expect(deletedUser.deletedAt).not.toBeNull()
            })
            test('User cannot update others, but can update his name and password and delete himself', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestUser(userToUpdate, user.user.id, {})
                })

                const accessDeniedPayloads = [
                    { isSupport: true },
                    { isAdmin: true },
                ]
                for (const payload of accessDeniedPayloads) {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestUser(userToUpdate, userToUpdate.user.id, payload)
                    })
                }

                await catchErrorFrom(async () => {
                    await updateTestUser(userToUpdate, userToUpdate.user.id, {
                        phone: createTestPhone(),
                    })
                }, ({ errors }) => {
                    expect(errors).toHaveLength(1)
                    expect(errors[0].message).toContain('Field "phone" is not defined by type "UserUpdateInput"')
                })

                const name = faker.internet.userName()
                const [deletedUser] = await updateTestUser(userToUpdate, userToUpdate.user.id, {
                    name,
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedUser).toHaveProperty('name', name)
                expect(deletedUser).toHaveProperty('deletedAt')
                expect(deletedUser.deletedAt).not.toBeNull()
            })
            test('Anonymous cannot update anyone', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestUser(anonymous, userToUpdate.user.id, {})
                })
            })
        })
        test('Hard-delete is prohibited', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await User.delete(admin, user.user.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await User.delete(support, user.user.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await User.delete(user, user.user.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await User.delete(anonymous, user.user.id)
            })
        })
    })
})