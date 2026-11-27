require('@condo/domains/common/utils/testSchema/env').mockEnv({
    DISABLE_BILLING_RECEIPT_SERVICES_DISTRIBUTION: () => false,
})

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const { gql } = require('graphql-tag')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { TestUtils, ResidentTestMixin } = require('@condo/domains/billing/utils/testSchema/testUtils')
const { BILLING_RECEIPT_SERVICE_CATEGORIES } = require('@condo/domains/common/constants/featureflags')

describe('Resident billing receipt servicesDistribution selection', () => {
    setFakeClientMode(index)

    afterEach(() => jest.restoreAllMocks())

    test('reads the categories flag only when servicesDistribution is requested', async () => {
        const utils = new TestUtils([ResidentTestMixin])
        await utils.init()
        const accountNumber = faker.random.alphaNumeric(12)
        const [[{ id }]] = await utils.createReceipts([utils.createJSONReceipt({
            accountNumber,
            services: [{ id: 'water', name: 'Water removal', toPay: '1.25', toPayDetails: null }],
            toPay: '1.25',
        })])
        const resident = await utils.createResident()
        await utils.createServiceConsumer(resident, accountNumber)

        const originalGetFeatureValue = featureToggleManager.getFeatureValue.bind(featureToggleManager)
        const getFeatureValue = jest.spyOn(featureToggleManager, 'getFeatureValue').mockImplementation((context, flag, ...args) => {
            if (flag === BILLING_RECEIPT_SERVICE_CATEGORIES) {
                return Promise.resolve(null)
            }
            return originalGetFeatureValue(context, flag, ...args)
        })

        const readCategoriesCalls = () => getFeatureValue.mock.calls.filter(([, flag]) => flag === BILLING_RECEIPT_SERVICE_CATEGORIES)
        const client = utils.clients.resident
        const variables = { where: { id } }

        const withoutDistribution = await client.query(gql`
            query receiptWithoutDistribution ($where: ResidentBillingReceiptWhereInput) {
                allResidentBillingReceipts(where: $where) { id }
            }
        `, variables)

        expect(withoutDistribution.errors).toBeUndefined()
        expect(withoutDistribution.data.allResidentBillingReceipts).toEqual([{ id }])
        expect(readCategoriesCalls()).toHaveLength(0)

        const withDistribution = await client.query(gql`
            query receiptWithDistribution ($where: ResidentBillingReceiptWhereInput) {
                allResidentBillingReceipts(where: $where) {
                    id
                    servicesDistribution { categoryName amount color }
                }
            }
        `, variables)

        expect(withDistribution.errors).toBeUndefined()
        expect(withDistribution.data.allResidentBillingReceipts).toEqual([{
            id,
            servicesDistribution: [{ categoryName: expect.any(String), amount: '1.25', color: expect.any(String) }],
        }])
        expect(readCategoriesCalls()).toHaveLength(1)

        getFeatureValue.mockClear()
        const admin = utils.clients.admin
        const directWithoutDistribution = await admin.query(gql`
            query billingReceiptWithoutDistribution ($where: BillingReceiptWhereUniqueInput!) {
                BillingReceipt(where: $where) { id }
            }
        `, variables)

        expect(directWithoutDistribution.errors).toBeUndefined()
        expect(directWithoutDistribution.data.BillingReceipt).toEqual({ id })
        expect(readCategoriesCalls()).toHaveLength(0)

        const directWithDistribution = await admin.query(gql`
            query billingReceiptWithDistribution ($where: BillingReceiptWhereUniqueInput!) {
                BillingReceipt(where: $where) {
                    id
                    servicesDistribution { categoryName amount color }
                }
            }
        `, variables)

        expect(directWithDistribution.errors).toBeUndefined()
        expect(directWithDistribution.data.BillingReceipt).toEqual({
            id,
            servicesDistribution: [{ categoryName: expect.any(String), amount: '1.25', color: expect.any(String) }],
        })
        expect(readCategoriesCalls()).toHaveLength(1)
    })
})
