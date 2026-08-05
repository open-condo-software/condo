const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAuthenticationErrorToResult,
} = require('@open-condo/keystone/test.utils')

const {
    allCardBindingsByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

describe('AllCardBindingsService', () => {
    test('admin: execute', async () => {
        const client = await makeLoggedInAdminClient()

        const [result] = await allCardBindingsByTestClient(client, { user: { id: faker.datatype.uuid() } })

        expect(result.cardTokens).toHaveLength(0)
    })

    test('user: execute', async () => {
        const client = await makeClientWithNewRegisteredAndLoggedInUser()

        const [result] = await allCardBindingsByTestClient(client, { user: { id: faker.datatype.uuid() } })

        expect(result.cardTokens).toHaveLength(0)
    })

    test('anonymous: execute', async () => {
        const client = await makeClient()

        await expectToThrowAuthenticationErrorToResult(async () => {
            await allCardBindingsByTestClient(client, { user: { id: faker.datatype.uuid() } })
        })
    })
})