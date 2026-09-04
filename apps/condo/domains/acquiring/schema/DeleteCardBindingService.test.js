const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowAccessDeniedErrorToResult,
} = require('@open-condo/keystone/test.utils')

const {
    deleteCardBindingByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithResidentUser,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

describe('DeleteCardBindingService', () => {
    test('admin: can execute', async () => {
        const client = await makeLoggedInAdminClient()

        const [result] = await deleteCardBindingByTestClient(client, {
            user: {
                id: faker.datatype.uuid(),
            },
            cardId: faker.datatype.uuid(),
        })

        expect(result.status).toBe('ok')
    })

    test('resident: can execute for own card', async () => {
        const client = await makeClientWithResidentUser()

        const [result] = await deleteCardBindingByTestClient(client, {
            user: {
                id: client.user.id,
            },
            cardId: faker.datatype.uuid(),
        })

        expect(result.status).toBe('ok')
    })

    test('resident: cannot execute for another user card', async () => {
        const client = await makeClientWithResidentUser()

        await expectToThrowAccessDeniedErrorToResult(async () => {
            await deleteCardBindingByTestClient(client, {
                user: {
                    id: faker.datatype.uuid(),
                },
                cardId: faker.datatype.uuid(),
            })
        })
    })

    test('service: can execute for own card', async () => {
        const client = await makeClientWithServiceUser()

        const [result] = await deleteCardBindingByTestClient(client, {
            user: {
                id: client.user.id,
            },
            cardId: faker.datatype.uuid(),
        })

        expect(result.status).toBe('ok')
    })

    test('anonymous: cannot execute', async () => {
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