const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAuthenticationErrorToResult,
} = require('@open-condo/keystone/test.utils')

const {
    deleteCardBindingByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

describe('DeleteCardBindingService', () => {
    test('admin: execute', async () => {
        const client = await makeLoggedInAdminClient()

        const [result] = await deleteCardBindingByTestClient(client, {
            user: {
                id: faker.datatype.uuid(),
            },
            cardId: faker.datatype.uuid(),
        })

        expect(result.status).toBe('ok')
    })

    test('user: execute', async () => {
        const client = await makeClientWithNewRegisteredAndLoggedInUser()

        const [result] = await deleteCardBindingByTestClient(client, {
            user: {
                id: faker.datatype.uuid(),
            },
            cardId: faker.datatype.uuid(),
        })

        expect(result.status).toBe('ok')
    })

    test('anonymous: execute', async () => {
        const client = await makeClient()

        await expectToThrowAuthenticationErrorToResult(async () => {
            await deleteCardBindingByTestClient(client, {
                user: {
                    id: faker.datatype.uuid(),
                },
                cardId: faker.datatype.uuid(),
            })
        })
    })
})