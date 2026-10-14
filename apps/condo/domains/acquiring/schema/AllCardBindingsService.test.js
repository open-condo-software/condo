const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowAccessDeniedErrorToResult,
} = require('@open-condo/keystone/test.utils')

const { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } = require('@condo/domains/acquiring/constants/integration')
const { 
    allCardBindingsByTestClient, 
    createTestAcquiringIntegration, 
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    makeClientWithResidentUser,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')
const {createTestAcquiringIntegrationAccessRight} = require("../utils/testSchema");


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
        const adminUser = await makeLoggedInAdminClient()
        const serviceUser = await makeClientWithServiceUser()
        const [acquiringIntegration] = await createTestAcquiringIntegration(adminUser, { type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE })
        await createTestAcquiringIntegrationAccessRight(adminUser, acquiringIntegration, serviceUser.user)

        const [result] = await allCardBindingsByTestClient(serviceUser, {
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