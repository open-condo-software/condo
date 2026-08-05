const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const { getUserCards } = require('@condo/domains/acquiring/utils/serverSchema/cardsOnlineInteraction')
const {
    allCardBindingsByTestClient,
    createTestAcquiringIntegration,
} = require('@condo/domains/acquiring/utils/testSchema')
const { TestUtils, AcquiringTestMixin } = require('@condo/domains/billing/utils/testSchema/testUtils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

jest.mock('@condo/domains/acquiring/utils/serverSchema/cardsOnlineInteraction', () => ({
    getUserCards: jest.fn(),
}))

function makeTestCard (overrides = {}) {
    return {
        id: faker.datatype.uuid(),
        acquiringIntegrationId: faker.datatype.uuid(),
        cardNumber: 'masked-card-number',
        paymentSystem: 'payment-system',
        expiration: 'expiration',
        bankName: 'bank-name',
        bankCountryCode: 'country-code',
        createdAt: new Date().toISOString(),
        ...overrides,
    }
}

function mockCardsForIntegrations (cardsByIntegration) {
    getUserCards.mockImplementation((url, userId, integrationId) => {
        return Promise.resolve(cardsByIntegration[integrationId] || [])
    })
}

describe('AllCardBindingsService', () => {
    let userClient
    let adminClient
    let utils

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        userClient = await makeClientWithNewRegisteredAndLoggedInUser()

        utils = new TestUtils([AcquiringTestMixin])
        await utils.init()

        await utils.updateAcquiringIntegration({
            getUserCardsUrl: 'https://example.com',
            deleteUserCardUrl: 'https://example.com',
        })
    })

    beforeEach(() => {
        getUserCards.mockReset()
    })

    test('should return card bindings from integrations', async () => {
        const integrationId = utils.acquiringIntegration.id

        mockCardsForIntegrations({
            [integrationId]: [
                makeTestCard({
                    id: 'card-id',
                    acquiringIntegrationId: integrationId,
                }),
            ],
        })

        const [result] = await allCardBindingsByTestClient(userClient, {
            user: {
                id: faker.datatype.uuid(),
            },
        })

        expect(result.cardTokens).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'card-id',
                    cardNumber: 'masked-card-number',
                }),
            ])
        )

        expect(getUserCards).toHaveBeenCalled()
    })


    test('should merge cards with same id from different integrations', async () => {
        const [secondIntegration] = await createTestAcquiringIntegration(adminClient, {
            getUserCardsUrl: 'https://example.com',
            deleteUserCardUrl: 'https://example.com',
        })

        const cardId = faker.datatype.uuid()

        mockCardsForIntegrations({
            [utils.acquiringIntegration.id]: [
                makeTestCard({
                    id: cardId,
                    acquiringIntegrationId: utils.acquiringIntegration.id,
                }),
            ],
            [secondIntegration.id]: [
                makeTestCard({
                    id: cardId,
                    acquiringIntegrationId: secondIntegration.id,
                }),
            ],
        })

        const [result] = await allCardBindingsByTestClient(userClient, {
            user: {
                id: faker.datatype.uuid(),
            },
        })

        expect(result.cardTokens).toHaveLength(1)

        expect(result.cardTokens[0]).toEqual(
            expect.objectContaining({
                id: cardId,
                acquiringIntegrationIds: expect.arrayContaining([
                    utils.acquiringIntegration.id,
                    secondIntegration.id,
                ]),
            })
        )
    })


    test('should return empty result when integration has no cards', async () => {
        mockCardsForIntegrations({
            [utils.acquiringIntegration.id]: [],
        })

        const [result] = await allCardBindingsByTestClient(userClient, {
            user: {
                id: faker.datatype.uuid(),
            },
        })

        expect(result.cardTokens).toEqual([])
    })


    test('should fill missing card metadata from another integration', async () => {
        const [secondIntegration] = await createTestAcquiringIntegration(adminClient, {
            getUserCardsUrl: 'https://example.com',
            deleteUserCardUrl: 'https://example.com',
        })

        const cardId = faker.datatype.uuid()

        mockCardsForIntegrations({
            [utils.acquiringIntegration.id]: [
                makeTestCard({
                    id: cardId,
                    acquiringIntegrationId: utils.acquiringIntegration.id,
                    bankName: null,
                    bankCountryCode: null,
                }),
            ],
            [secondIntegration.id]: [
                makeTestCard({
                    id: cardId,
                    acquiringIntegrationId: secondIntegration.id,
                    bankName: 'another-bank',
                    bankCountryCode: 'another-country',
                }),
            ],
        })

        const [result] = await allCardBindingsByTestClient(userClient, {
            user: {
                id: faker.datatype.uuid(),
            },
        })

        expect(result.cardTokens[0]).toEqual(
            expect.objectContaining({
                id: cardId,
                bankName: 'another-bank',
                bankCountryCode: 'another-country',
            })
        )
    })


    test('should ignore failed integration and return cards from successful integrations', async () => {
        const [failedIntegration] = await createTestAcquiringIntegration(adminClient, {
            getUserCardsUrl: 'https://example.com',
            deleteUserCardUrl: 'https://example.com',
        })

        getUserCards.mockImplementation((url, userId, integrationId) => {
            if (integrationId === failedIntegration.id) {
                return Promise.reject(new Error('failed'))
            }

            return Promise.resolve([
                makeTestCard({
                    id: 'card-id',
                    acquiringIntegrationId: integrationId,
                }),
            ])
        })

        const [result] = await allCardBindingsByTestClient(userClient, {
            user: {
                id: faker.datatype.uuid(),
            },
        })

        expect(result.cardTokens).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'card-id',
                }),
            ])
        )
    })
})