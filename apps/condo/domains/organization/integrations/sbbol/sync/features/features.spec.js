/**
 * @jest-environment node
 */
jest.mock('./config')

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { createTestAcquiringIntegration, AcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBillingIntegration, BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/testSchema')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { SERVICE_PROVIDER_PROFILE_FEATURE } = require('@condo/domains/organization/constants/features')
const { createTestOrganization, Organization } = require('@condo/domains/organization/utils/testSchema')

const { keystone } = index

describe('syncFeatures', () => {
    setFakeClientMode(index)

    let billingId
    let acquiringId
    let admin
    let ctx
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const [billing] = await createTestBillingIntegration(admin)
        const [acquiring] = await createTestAcquiringIntegration(admin)
        billingId = billing.id
        acquiringId = acquiring.id
        const adminContext = await keystone.createContext({ skipAccessControl: true })
        ctx = {
            keystone,
            context: adminContext,
        }
    })
    beforeEach(() => {
        jest.resetAllMocks()
        const { getSPPConfig } = require('./config')
        getSPPConfig.mockReturnValue({ BillingIntegrationId: billingId, AcquiringIntegrationId: acquiringId })
    })

    it('Mocking @open-condo/config should work fine', async () => {
        const { getSPPConfig } = require('./config')
        const config = await getSPPConfig()
        expect(billingId).toBeDefined()
        expect(acquiringId).toBeDefined()
        expect(config).toHaveProperty('BillingIntegrationId', billingId)
        expect(config).toHaveProperty('AcquiringIntegrationId', acquiringId)
    })
    describe('ServiceProviderProfile feature', () => {
        it('Should create billing and acquiring contexts, if organization has no contexts', async () => {
            const [org] = await createTestOrganization(admin)
            const { syncFeatures } = require('./index')
            await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })

            const billingContexts = await BillingIntegrationOrganizationContext.getAll(admin, {
                organization: { id: org.id },
            })
            expect(billingContexts).toHaveLength(1)
            const [billingCtx] = billingContexts
            expect(billingCtx).toHaveProperty(['integration', 'id'], billingId)
            expect(billingCtx).toHaveProperty('status', CONTEXT_FINISHED_STATUS)

            const acquiringContexts = await AcquiringIntegrationContext.getAll(admin, {
                organization: { id: org.id },
            })
            expect(acquiringContexts).toHaveLength(1)
            const [acquiringCtx] = acquiringContexts
            expect(acquiringCtx).toHaveProperty(['integration', 'id'], acquiringId)
            expect(acquiringCtx).toHaveProperty('status', CONTEXT_FINISHED_STATUS)

            const updatedOrg = await Organization.getOne(admin, {
                id: org.id,
            })
            expect(updatedOrg).toHaveProperty('features')
            expect(updatedOrg.features).toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE]))
        })
    })
})