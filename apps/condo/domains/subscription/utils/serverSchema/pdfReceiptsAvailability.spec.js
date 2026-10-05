const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, setFeatureFlag } = require('@open-condo/keystone/test.utils')

const {
    BillingReceiptFile,
    ResidentBillingReceipt,
    createTestBillingIntegration,
    createTestBillingIntegrationOrganizationContext,
    updateTestBillingIntegrationOrganizationContext,
} = require('@condo/domains/billing/utils/testSchema')
const { TestUtils, ResidentTestMixin } = require('@condo/domains/billing/utils/testSchema/testUtils')
const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const { SERVICE_PROVIDER_PROFILE_FEATURE } = require('@condo/domains/organization/constants/features')
const { Organization, createTestOrganization, registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_FEATURE_AVAILABILITY, SUBSCRIPTION_PAYMENT_BUFFER_DAYS } = require('@condo/domains/subscription/constants')
const {
    createTestSubscriptionPlan,
    createTestSubscriptionContext,
    getAvailableSubscriptionPlansByTestClient,
} = require('@condo/domains/subscription/utils/testSchema')

const ENV_KEY = 'REGISTRY_UPLOAD_INTEGRATION_ID'

async function withRegistryUploadIntegration (integrationId, callback) {
    const currentValue = process.env[ENV_KEY]
    process.env[ENV_KEY] = integrationId
    try {
        return await callback()
    } finally {
        process.env[ENV_KEY] = currentValue
    }
}

async function createReceiptWithFile (utils) {
    const accountNumber = faker.random.alphaNumeric(12)
    const [[receipt]] = await utils.createReceipts([
        utils.createJSONReceipt({ accountNumber }),
    ])
    const [receiptFile] = await utils.createBillingReceiptFile(receipt.id)
    const resident = await utils.createResident()
    await utils.createServiceConsumer(resident, accountNumber)

    return { receipt, receiptFile }
}

async function createActivePdfReceiptsSubscription (admin, organization) {
    const [subscriptionPlan] = await createTestSubscriptionPlan(admin, {
        name: faker.commerce.productName(),
        organizationType: organization.type,
        pdfReceipts: true,
    })
    const endAt = dayjs().add(30, 'days').format('YYYY-MM-DD')
    await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
        startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        endAt,
        isTrial: false,
    })

    return { endAt }
}

describe('pdf receipts subscription', () => {
    setFakeClientMode(index)

    let utils
    let subscribedUtils
    let admin
    let previousEnvValue

    beforeAll(async () => {
        setFeatureFlag(SUBSCRIPTIONS, true)

        utils = new TestUtils([ResidentTestMixin])
        await utils.init()
        subscribedUtils = new TestUtils([ResidentTestMixin])
        await subscribedUtils.init()
        admin = utils.clients.admin

        await createTestSubscriptionPlan(admin, { organizationType: utils.organization.type })
        await createActivePdfReceiptsSubscription(admin, subscribedUtils.organization)

        previousEnvValue = process.env[ENV_KEY]
        process.env[ENV_KEY] = utils.billingIntegration.id
    })

    afterAll(() => {
        if (previousEnvValue === undefined) delete process.env[ENV_KEY]
        else process.env[ENV_KEY] = previousEnvValue
        setFeatureFlag(SUBSCRIPTIONS, false)
    })

    describe('Organization.subscription.pdfReceiptsEndAt', () => {
        test('returns null for organization connected to billing integration requiring subscription', async () => {
            const organization = await Organization.getOne(admin, { id: utils.organization.id })

            expect(organization.subscription.pdfReceiptsEndAt).toBeNull()
        })

        test('returns null for organization without billing integrations', async () => {
            const [registeredOrganization] = await registerNewOrganization(admin)

            const organization = await Organization.getOne(admin, { id: registeredOrganization.id })

            expect(organization.subscription.pdfReceiptsEndAt).toBeNull()
        })

        test('returns plan end date for subscribed organization connected to billing integration requiring subscription', async () => {
            const [registeredOrganization] = await registerNewOrganization(admin)
            await createTestBillingIntegrationOrganizationContext(admin, registeredOrganization, utils.billingIntegration)
            const { endAt } = await createActivePdfReceiptsSubscription(admin, registeredOrganization)

            const organization = await Organization.getOne(admin, { id: registeredOrganization.id })

            expect(organization.subscription.pdfReceiptsEndAt).toBe(dayjs(endAt).add(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days').format('YYYY-MM-DD'))
        })

        test('returns far-future date for organization connected to another billing integration', async () => {
            const [registeredOrganization] = await registerNewOrganization(admin)
            const [billingIntegration] = await createTestBillingIntegration(admin)
            await createTestBillingIntegrationOrganizationContext(admin, registeredOrganization, billingIntegration)

            const organization = await Organization.getOne(admin, { id: registeredOrganization.id })

            expect(organization.subscription.pdfReceiptsEndAt).toBe(dayjs().add(100, 'years').format('YYYY-MM-DD'))
        })

        test('ignores deleted context of another billing integration', async () => {
            const [registeredOrganization] = await registerNewOrganization(admin)
            const [billingIntegration] = await createTestBillingIntegration(admin)
            const [billingContext] = await createTestBillingIntegrationOrganizationContext(admin, registeredOrganization, billingIntegration)
            await updateTestBillingIntegrationOrganizationContext(admin, billingContext.id, { deletedAt: dayjs().toISOString() })
            await createTestBillingIntegrationOrganizationContext(admin, registeredOrganization, utils.billingIntegration)

            const organization = await Organization.getOne(admin, { id: registeredOrganization.id })

            expect(organization.subscription.pdfReceiptsEndAt).toBeNull()
        })

        test('returns far-future date when registry upload integration is not configured', async () => {
            const organization = await withRegistryUploadIntegration('', () => Organization.getOne(admin, { id: utils.organization.id }))

            expect(organization.subscription.pdfReceiptsEndAt).toBe(dayjs().add(100, 'years').format('YYYY-MM-DD'))
        })
    })

    describe('getAvailableSubscriptionPlans.features', () => {
        async function getPdfReceiptsAvailability (organization) {
            const [result] = await getAvailableSubscriptionPlansByTestClient(admin, organization)
            return result.features.find(({ feature }) => feature === 'pdfReceipts')?.availability
        }

        test('sells pdf receipts by plan to organization connected to registry exchange', async () => {
            const availability = await getPdfReceiptsAvailability(utils.organization)

            expect(availability).toBe(SUBSCRIPTION_FEATURE_AVAILABILITY.BY_PLAN)
        })

        test('sells pdf receipts by plan when registry exchange is connected together with another billing', async () => {
            const [registeredOrganization] = await registerNewOrganization(admin)
            const [billingIntegration] = await createTestBillingIntegration(admin)
            await createTestBillingIntegrationOrganizationContext(admin, registeredOrganization, billingIntegration)
            await createTestBillingIntegrationOrganizationContext(admin, registeredOrganization, utils.billingIntegration)

            const availability = await getPdfReceiptsAvailability(registeredOrganization)

            expect(availability).toBe(SUBSCRIPTION_FEATURE_AVAILABILITY.BY_PLAN)
        })

        test('gives pdf receipts for free to organization connected to another billing', async () => {
            const [registeredOrganization] = await registerNewOrganization(admin)
            const [billingIntegration] = await createTestBillingIntegration(admin)
            await createTestBillingIntegrationOrganizationContext(admin, registeredOrganization, billingIntegration)

            const availability = await getPdfReceiptsAvailability(registeredOrganization)

            expect(availability).toBe(SUBSCRIPTION_FEATURE_AVAILABILITY.FREE)
        })

        test('requires billing setup from organization without billing', async () => {
            const [registeredOrganization] = await registerNewOrganization(admin)

            const availability = await getPdfReceiptsAvailability(registeredOrganization)

            expect(availability).toBe(SUBSCRIPTION_FEATURE_AVAILABILITY.REQUIRES_SETUP)
        })

        test('hides pdf receipts from SPP organization', async () => {
            const [sppOrganization] = await createTestOrganization(admin, { features: [SERVICE_PROVIDER_PROFILE_FEATURE] })
            await createTestBillingIntegrationOrganizationContext(admin, sppOrganization, utils.billingIntegration)

            const availability = await getPdfReceiptsAvailability(sppOrganization)

            expect(availability).toBe(SUBSCRIPTION_FEATURE_AVAILABILITY.HIDDEN)
        })

        test('gives pdf receipts for free when registry upload integration is not configured', async () => {
            const availability = await withRegistryUploadIntegration('', () => getPdfReceiptsAvailability(utils.organization))

            expect(availability).toBe(SUBSCRIPTION_FEATURE_AVAILABILITY.FREE)
        })
    })

    describe('BillingReceiptFile.file', () => {
        test('resident does not get file without subscription', async () => {
            const { receiptFile } = await createReceiptWithFile(utils)

            const residentReceiptFile = await BillingReceiptFile.getOne(utils.clients.resident, { id: receiptFile.id })

            expect(residentReceiptFile).toBeDefined()
            expect(residentReceiptFile.file).toBeNull()
        })

        test('employee and admin get file without subscription', async () => {
            const { receiptFile } = await createReceiptWithFile(utils)

            const employeeReceiptFile = await BillingReceiptFile.getOne(utils.clients.employee.billing, { id: receiptFile.id })
            const adminReceiptFile = await BillingReceiptFile.getOne(admin, { id: receiptFile.id })

            expect(employeeReceiptFile.file).toBeTruthy()
            expect(adminReceiptFile.file).toBeTruthy()
        })

        test('resident gets file with active subscription', async () => {
            const { receiptFile } = await createReceiptWithFile(subscribedUtils)

            const residentReceiptFile = await withRegistryUploadIntegration(
                subscribedUtils.billingIntegration.id,
                () => BillingReceiptFile.getOne(subscribedUtils.clients.resident, { id: receiptFile.id })
            )

            expect(residentReceiptFile.file).toBeTruthy()
        })
    })

    describe('allResidentBillingReceipts', () => {
        test('returns empty file without subscription', async () => {
            const { receipt } = await createReceiptWithFile(utils)

            const residentReceipts = await ResidentBillingReceipt.getAll(utils.clients.resident)
            const residentReceipt = residentReceipts.find(({ id }) => id === receipt.id)

            expect(residentReceipt).toBeDefined()
            expect(residentReceipt.file).toBeNull()
        })

        test('returns file with active subscription', async () => {
            const { receipt } = await createReceiptWithFile(subscribedUtils)

            const residentReceipts = await withRegistryUploadIntegration(
                subscribedUtils.billingIntegration.id,
                () => ResidentBillingReceipt.getAll(subscribedUtils.clients.resident)
            )
            const residentReceipt = residentReceipts.find(({ id }) => id === receipt.id)

            expect(residentReceipt.file).toBeTruthy()
        })
    })
})
