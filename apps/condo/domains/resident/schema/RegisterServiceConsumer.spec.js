const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { fetch } = require('@open-condo/keystone/fetch')
const { expectToThrowGQLError, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const {
    ONLINE_INTERACTION_CHECK_ACCOUNT_NOT_FOUND_STATUS,
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
} = require('@condo/domains/billing/utils/serverSchema/checkBillingAccountNumberForOrganization')
const {
    TestUtils,
    OrganizationTestMixin,
    PropertyTestMixin,
    AcquiringTestMixin,
    BillingTestMixin,
    ResidentTestMixin,
    MeterTestMixin,
} = require('@condo/domains/billing/utils/testSchema/testUtils')
const { ERRORS: { BILLING_ACCOUNT_NOT_FOUND, ACCOUNT_NUMBER_IS_NOT_SPECIFIED } } = require('@condo/domains/resident/schema/RegisterServiceConsumerService')
const { registerServiceConsumerByTestClient } = require('@condo/domains/resident/utils/testSchema')



describe('BillingIntegration with online interaction', () => {

    // Проверить в раздельном потоке
    const TEST_INTERACTION_URL = 'https://external-integration.com/api/check?token=some_securitey_token'
    let utils

    setFakeClientMode(index, { excludeApps: [] })


    beforeAll(async () => {
        utils = new TestUtils([OrganizationTestMixin, PropertyTestMixin, AcquiringTestMixin, BillingTestMixin, ResidentTestMixin, MeterTestMixin])
        await utils.init()
        await utils.updateBillingIntegration({ checkAccountNumberUrl: TEST_INTERACTION_URL })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should throw an error if no billingAccount found and check for online interaction failed', async () => {
        const resident = await utils.createResident()
        const notExistingAccountNumber = faker.random.alphaNumeric(16)
        const mockResponse = {
            ok: true,
            json: jest.fn().mockResolvedValue({ status: ONLINE_INTERACTION_CHECK_ACCOUNT_NOT_FOUND_STATUS }),
        }
        fetch.mockResolvedValueOnce(mockResponse)
        await expectToThrowGQLError(async () => {
            await registerServiceConsumerByTestClient(utils.clients.resident, {
                residentId: resident.id,
                accountNumber: notExistingAccountNumber,
                organizationId: utils.organization.id,
            })
        }, BILLING_ACCOUNT_NOT_FOUND)
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    test('should work if no billingAccount in condo, but check for online interaction succeeded', async () => {
        const resident = await utils.createResident()
        const existingAccount = faker.random.alphaNumeric(16)
        const mockResponse = {
            ok: true,
            json: jest.fn().mockResolvedValue({ status: ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS }),
        }
        fetch.mockResolvedValueOnce(mockResponse)
        const [newConsumer] = await registerServiceConsumerByTestClient(utils.clients.resident, {
            residentId: resident.id,
            accountNumber: existingAccount,
            organizationId: utils.organization.id,
        })
        expect(newConsumer).toHaveProperty('id')
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    test('should not call online interaction if account already presence in condo', async () => {
        const resident = await utils.createResident()
        const existingAccount = faker.random.alphaNumeric(16)
        await utils.createReceipts([
            utils.createJSONReceipt({ accountNumber: existingAccount }),
        ])
        const mockResponse = {
            ok: true,
            json: jest.fn().mockResolvedValue({ status: ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS }),
        }
        fetch.mockResolvedValueOnce(mockResponse)
        const [newConsumer] = await registerServiceConsumerByTestClient(utils.clients.resident, {
            residentId: resident.id,
            accountNumber: existingAccount,
            organizationId: utils.organization.id,
        })
        expect(newConsumer).toHaveProperty('id')
        expect(fetch).toHaveBeenCalledTimes(0)
    })
})