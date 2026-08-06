const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const { deleteUserCard } = require('@condo/domains/acquiring/utils/serverSchema/cardsOnlineInteraction')
const {
    deleteCardBindingByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const { TestUtils, AcquiringTestMixin } = require('@condo/domains/billing/utils/testSchema/testUtils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

jest.mock('@condo/domains/acquiring/utils/serverSchema/cardsOnlineInteraction', () => ({
    deleteUserCard: jest.fn(),
}))

describe('DeleteCardBindingService', () => {
    let adminClient
    let userClient
    let utils

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        userClient = await makeClientWithNewRegisteredAndLoggedInUser()

        utils = new TestUtils([AcquiringTestMixin])
        await utils.init()

        await utils.updateAcquiringIntegration({
            deleteUserCardUrl: 'https://example.com',
            getUserCardsUrl: 'https://example.com',
        })
    })

    test('should delete card binding', async () => {
        const client = await makeLoggedInAdminClient()

        const userId = faker.datatype.uuid()
        const cardId = faker.datatype.uuid()

        deleteUserCard.mockResolvedValue()

        await deleteCardBindingByTestClient(client, {
            user: {
                id: userId,
            },
            cardId,
        })

        expect(deleteUserCard).toHaveBeenCalledWith(
            'https://example.com',
            userId,
            cardId,
            utils.acquiringIntegration.id,
        )
    })
})