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
const { Organization, registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS } = require('@condo/domains/subscription/constants')
const { createTestSubscriptionPlan, createTestSubscriptionContext } = require('@condo/domains/subscription/utils/testSchema')

const ENV_KEY = 'PDF_RECEIPTS_SUBSCRIPTION_REQUIRED_BILLING_INTEGRATION_IDS'

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
        process.env[ENV_KEY] = JSON.stringify([utils.billingIntegration.id, subscribedUtils.billingIntegration.id])
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

        test('returns far-future date when no billing integrations require subscription', async () => {
            process.env[ENV_KEY] = '[]'
            try {
                const organization = await Organization.getOne(admin, { id: utils.organization.id })

                expect(organization.subscription.pdfReceiptsEndAt).toBe(dayjs().add(100, 'years').format('YYYY-MM-DD'))
            } finally {
                process.env[ENV_KEY] = JSON.stringify([utils.billingIntegration.id, subscribedUtils.billingIntegration.id])
            }
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

            const residentReceiptFile = await BillingReceiptFile.getOne(subscribedUtils.clients.resident, { id: receiptFile.id })

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

            const residentReceipts = await ResidentBillingReceipt.getAll(subscribedUtils.clients.resident)
            const residentReceipt = residentReceipts.find(({ id }) => id === receipt.id)

            expect(residentReceipt.file).toBeTruthy()
        })
    })
})
