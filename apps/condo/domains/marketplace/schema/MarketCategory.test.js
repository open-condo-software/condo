/*
* @jest-environment node
*/

const { makeLoggedInAdminClient, makeClient, expectValuesOfCommonFields, expectToThrowGQLError, expectToThrowInternalError } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj, expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')

const { ERRORS } = require('@condo/domains/marketplace/schema/MarketCategory')
const { MarketCategory, createTestMarketCategory, updateTestMarketCategory } = require('@condo/domains/marketplace/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser, makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')

describe('MarketCategory', () => {
    let admin, support, anonymous, user, checkReadAccessCategoryObj
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        user = await makeClientWithNewRegisteredAndLoggedInUser()
        anonymous = await makeClient();
        [checkReadAccessCategoryObj] = await createTestMarketCategory(admin)
    })
    describe('access tests', () => {
        describe('admin', () => {
            test('can create', async () => {
                const [obj, attrs] = await createTestMarketCategory(admin)
                expectValuesOfCommonFields(obj, attrs, admin)
            })

            test('can update', async () => {
                const [objCreated] = await createTestMarketCategory(admin)

                const [obj, attrs] = await updateTestMarketCategory(admin, objCreated.id)

                expect(obj.dv).toEqual(1)
                expect(obj.sender).toEqual(attrs.sender)
                expect(obj.v).toEqual(2)
                expect(obj.updatedBy).toEqual(expect.objectContaining({ id: admin.user.id }))
            })

            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await MarketCategory.delete(admin, 'id')
                })
            })

            test('can read', async () => {
                const objs = await MarketCategory.getAll(admin, {}, { sortBy: ['updatedAt_DESC'] })

                expect(objs.length).toBeGreaterThanOrEqual(1)
                expect(objs).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        id: checkReadAccessCategoryObj.id,
                    }),
                ]))
            })
        })

        describe('support', () => {
            test('can create', async () => {
                const [obj, attrs] = await createTestMarketCategory(support)
                expectValuesOfCommonFields(obj, attrs, support)
            })

            test('can update', async () => {
                const [objCreated] = await createTestMarketCategory(support)

                const [obj, attrs] = await updateTestMarketCategory(support, objCreated.id)

                expect(obj.dv).toEqual(1)
                expect(obj.sender).toEqual(attrs.sender)
                expect(obj.v).toEqual(2)
                expect(obj.updatedBy).toEqual(expect.objectContaining({ id: support.user.id }))
            })

            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await MarketCategory.delete(support, 'id')
                })
            })

            test('can read', async () => {
                const objs = await MarketCategory.getAll(support, {}, { sortBy: ['updatedAt_DESC'] })

                expect(objs.length).toBeGreaterThanOrEqual(1)
                expect(objs).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        id: checkReadAccessCategoryObj.id,
                    }),
                ]))
            })
        })

        describe('user', () => {
            test('can\'t create', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestMarketCategory(user)
                })
            })

            test('can\'t update', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestMarketCategory(user, 'id')
                })
            })

            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await MarketCategory.delete(user, 'id')
                })
            })

            test('can read', async () => {
                const objs = await MarketCategory.getAll(user, {}, { sortBy: ['updatedAt_DESC'] })

                expect(objs.length).toBeGreaterThanOrEqual(1)
                expect(objs).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        id: checkReadAccessCategoryObj.id,
                    }),
                ]))
            })
        })

        describe('anonymous', () => {
            test('can\'t create', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestMarketCategory(anonymous)
                })
            })

            test('can\'t update', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestMarketCategory(anonymous, 'id')
                })
            })

            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await MarketCategory.delete(anonymous, 'id')
                })
            })

            test('can\'t read', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await MarketCategory.getAll(anonymous, {}, { sortBy: ['updatedAt_DESC'] })
                })
            })
        })
    })

    describe('logic tests', () => {
        test('inheritance depth no more than 2', async () => {
            const [firstOrderCategoryObj] = await createTestMarketCategory(support)
            const [secondOrderCategoryObj] = await createTestMarketCategory(support, {
                parentCategory: { connect: { id: firstOrderCategoryObj.id } },
            })

            await expectToThrowGQLError(
                async () => { await createTestMarketCategory(support, {
                    parentCategory: { connect: { id: secondOrderCategoryObj.id } },
                }) },
                { ...ERRORS.MAXIMUM_DEPTH_REACHED },
                'obj'
            )
        })

        test('cannot connect to itself', async () => {
            const [objCreated] = await createTestMarketCategory(support)

            await expectToThrowGQLError(
                async () => { await updateTestMarketCategory(admin, objCreated.id, {
                    parentCategory: { connect: { id: objCreated.id } },
                }) },
                { ...ERRORS.CANNOT_CONNECT_TO_ITSELF },
                'obj'
            )
        })

        test('mobileSettings validation', async () => {
            await expectToThrowGQLError(
                async () => { await createTestMarketCategory(support, {
                    mobileSettings: { bgColor: '#3123d23r', titleColor: '#12sdf3' },
                }) },
                {
                    code: 'BAD_USER_INPUT',
                    type: 'INVALID_MOBILE_SETTINGS',
                    variable: ['data', 'mobileSettings'],
                },
                'obj'
            )
        })
    })
})
