const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowAccessDeniedErrorToResult,
} = require('@open-condo/keystone/test.utils')

const {
    allCardBindingsByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    makeClientWithResidentUser,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

describe('AllCardBindingsService', () => {
    test('admin: can execute for any cards', async () => {
        const client = await makeLoggedInAdminClient()

        const [result] = await allCardBindingsByTestClient(client, {
            user: { id: faker.datatype.uuid() },
        })

        expect(result.cardTokens).toHaveLength(0)
    })

    test('resident: can execute for own cards', async () => {
        const client = await makeClientWithResidentUser()

        const [result] = await allCardBindingsByTestClient(client, {
            user: { id: client.user.id },
        })

        expect(result.cardTokens).toHaveLength(0)
    })

    test('resident: cannot execute for other users cards', async () => {
        const client = await makeClientWithResidentUser()

        await expectToThrowAccessDeniedErrorToResult(async () => {
            await allCardBindingsByTestClient(client, {
                user: { id: faker.datatype.uuid() },
            })
        })
    })

    test('service: can execute for any cards', async () => {
        const client = await makeClientWithServiceUser()

        const [result] = await allCardBindingsByTestClient(client, {
            user: { id: faker.datatype.uuid() },
        })

        expect(result.cardTokens).toHaveLength(0)
    })

    test('anonymous: cannot execute', async () => {
        const client = await makeClient()

        await expectToThrowAuthenticationErrorToResult(async () => {
            await allCardBindingsByTestClient(client, {
                user: { id: faker.datatype.uuid() },
            })
        })
    })
})