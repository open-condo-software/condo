/**
 * @jest-environment node
 */
jest.mock('./config')

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const {
    createTestAcquiringIntegration,
    createTestAcquiringIntegrationContext,
    AcquiringIntegrationContext,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    createTestBillingIntegration,
    createTestBillingIntegrationOrganizationContext,
    BillingIntegrationOrganizationContext,
} = require('@condo/domains/billing/utils/testSchema')
const { CONTEXT_FINISHED_STATUS, CONTEXT_IN_PROGRESS_STATUS } = require('@condo/domains/miniapp/constants')
const { SERVICE_PROVIDER_PROFILE_FEATURE, ACTIVE_BANKING_FEATURE } = require('@condo/domains/organization/constants/features')
const { createTestOrganization, Organization } = require('@condo/domains/organization/utils/testSchema')

const { syncFeatures } = require('./index')

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
        it('Should create billing, acquiring contexts and update organization.features field, if organization has no contexts', async () => {
            const [org] = await createTestOrganization(admin)
            await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })

            const billingContexts = await BillingIntegrationOrganizationContext.getAll(admin, {
                organization: { id: org.id },
            })
            expect(billingContexts).toHaveLength(1)
            expect(billingContexts[0]).toHaveProperty(['integration', 'id'], billingId)
            expect(billingContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)

            const acquiringContexts = await AcquiringIntegrationContext.getAll(admin, {
                organization: { id: org.id },
            })
            expect(acquiringContexts).toHaveLength(1)
            expect(acquiringContexts[0]).toHaveProperty(['integration', 'id'], acquiringId)
            expect(acquiringContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)

            const updatedOrg = await Organization.getOne(admin, { id: org.id })
            expect(updatedOrg).toHaveProperty('features')
            expect(updatedOrg.features).toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE]))
        })

        it('Should connect existing contexts, if exists', async () => {
            const [org] = await createTestOrganization(admin)
            const [nonFinishedBillingCtx] = await createTestBillingIntegrationOrganizationContext(admin, org, { id: billingId }, {
                status: CONTEXT_IN_PROGRESS_STATUS,
            })
            const [nonFinishedAcquiringCtx] = await createTestAcquiringIntegrationContext(admin, org, { id: acquiringId }, {
                status: CONTEXT_IN_PROGRESS_STATUS,
            })
            await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })

            const billingContexts = await BillingIntegrationOrganizationContext.getAll(admin, {
                organization: { id: org.id },
            })
            expect(billingContexts).toHaveLength(1)
            expect(billingContexts[0]).toHaveProperty('id', nonFinishedBillingCtx.id)
            expect(billingContexts[0]).toHaveProperty(['integration', 'id'], billingId)
            expect(billingContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)

            const acquiringContexts = await AcquiringIntegrationContext.getAll(admin, {
                organization: { id: org.id },
            })
            expect(acquiringContexts).toHaveLength(1)
            expect(acquiringContexts[0]).toHaveProperty('id', nonFinishedAcquiringCtx.id)
            expect(acquiringContexts[0]).toHaveProperty(['integration', 'id'], acquiringId)
            expect(acquiringContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)

            const updatedOrg = await Organization.getOne(admin, { id: org.id })
            expect(updatedOrg).toHaveProperty('features')
            expect(updatedOrg.features).toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE]))
        })

        it('Should create contexts once', async () => {
            const [org] = await createTestOrganization(admin)
            await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })

            const syncedOrg = await Organization.getOne(admin, { id: org.id })
            expect(syncedOrg).toHaveProperty('features')
            expect(syncedOrg.features).toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE]))
            const billingContexts = await BillingIntegrationOrganizationContext.getAll(admin, { organization: { id: org.id } })
            expect(billingContexts).toHaveLength(1)
            expect(billingContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)
            expect(billingContexts[0]).toHaveProperty(['integration', 'id'], billingId)
            const acquiringContexts = await AcquiringIntegrationContext.getAll(admin, { organization: { id: org.id } })
            expect(acquiringContexts).toHaveLength(1)
            expect(acquiringContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)
            expect(acquiringContexts[0]).toHaveProperty(['integration', 'id'], acquiringId)

            await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })
            const againSyncedOrg = await Organization.getOne(admin, { id: org.id })
            expect(againSyncedOrg.features).toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE]))
            const newBillingContexts = await BillingIntegrationOrganizationContext.getAll(admin, { organization: { id: org.id } })
            expect(newBillingContexts).toHaveLength(1)
            expect(newBillingContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)
            expect(newBillingContexts[0]).toHaveProperty(['integration', 'id'], billingId)
            expect(newBillingContexts[0]).toHaveProperty('id', billingContexts[0].id)
            const newAcquiringContexts = await AcquiringIntegrationContext.getAll(admin, { organization: { id: org.id } })
            expect(newAcquiringContexts).toHaveLength(1)
            expect(newAcquiringContexts[0]).toHaveProperty('status', CONTEXT_FINISHED_STATUS)
            expect(newAcquiringContexts[0]).toHaveProperty(['integration', 'id'], acquiringId)
            expect(newAcquiringContexts[0]).toHaveProperty('id', acquiringContexts[0].id)
        })

        describe('Should not connect feature, but create additional contexts if another integration is connected', () => {
            it('Another billing integration', async () => {
                const [org] = await createTestOrganization(admin)
                const [anotherBilling] = await createTestBillingIntegration(admin)
                const [existingBillingCtx] = await createTestBillingIntegrationOrganizationContext(admin, org, anotherBilling, {
                    status: CONTEXT_FINISHED_STATUS,
                })
                await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })

                const billingContexts = await BillingIntegrationOrganizationContext.getAll(admin, { organization: { id: org.id } })
                expect(billingContexts).toHaveLength(2)
                expect(billingContexts).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        id: existingBillingCtx.id,
                        status: CONTEXT_FINISHED_STATUS,
                    }),
                    expect.objectContaining({
                        integration: expect.objectContaining({ id: billingId }),
                        status: CONTEXT_IN_PROGRESS_STATUS,
                    }),
                ]))
                const acquiringContexts = await AcquiringIntegrationContext.getAll(admin, { organization: { id: org.id } })
                expect(acquiringContexts).toHaveLength(1)
                expect(acquiringContexts[0]).toHaveProperty(['integration', 'id'], acquiringId)
                expect(acquiringContexts[0]).toHaveProperty('status', CONTEXT_IN_PROGRESS_STATUS)

                const updatedOrg = await Organization.getOne(admin, { id: org.id })
                expect(updatedOrg).toHaveProperty('features')
                expect(updatedOrg.features).not.toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE]))
            })
            it('Another acquiring integration', async () => {
                const [org] = await createTestOrganization(admin)
                const [anotherAcquiring] = await createTestAcquiringIntegration(admin)
                const [existingAcquiringCtx] = await createTestAcquiringIntegrationContext(admin, org, anotherAcquiring, {
                    status: CONTEXT_FINISHED_STATUS,
                })
                await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })

                const billingContexts = await BillingIntegrationOrganizationContext.getAll(admin, { organization: { id: org.id } })
                expect(billingContexts).toHaveLength(1)
                expect(billingContexts[0]).toHaveProperty(['integration', 'id'], billingId)
                expect(billingContexts[0]).toHaveProperty('status', CONTEXT_IN_PROGRESS_STATUS)
                const acquiringContexts = await AcquiringIntegrationContext.getAll(admin, { organization: { id: org.id } })
                expect(acquiringContexts).toHaveLength(2)
                expect(acquiringContexts).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        id: existingAcquiringCtx.id,
                        status: CONTEXT_FINISHED_STATUS,
                    }),
                    expect.objectContaining({
                        integration: expect.objectContaining({ id: acquiringId }),
                        status: CONTEXT_IN_PROGRESS_STATUS,
                    }),
                ]))
                const updatedOrg = await Organization.getOne(admin, { id: org.id })
                expect(updatedOrg).toHaveProperty('features')
                expect(updatedOrg.features).not.toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE]))
            })
        })
    })

    describe('ACTIVE_BANKING_FEATURE', () => {
        it('Should automatically add active_banking feature to all SBBOL organizations', async () => {
            const [org] = await createTestOrganization(admin)
            await syncFeatures({ context: ctx, organization: org, features: [] })

            const updatedOrg = await Organization.getOne(admin, { id: org.id })
            expect(updatedOrg).toHaveProperty('features')
            expect(updatedOrg.features).toEqual(expect.arrayContaining([ACTIVE_BANKING_FEATURE]))
        })

        it('Should add both SPP and active_banking features', async () => {
            const [org] = await createTestOrganization(admin)
            await syncFeatures({ context: ctx, organization: org, features: [SERVICE_PROVIDER_PROFILE_FEATURE] })

            const updatedOrg = await Organization.getOne(admin, { id: org.id })
            expect(updatedOrg).toHaveProperty('features')
            expect(updatedOrg.features).toEqual(expect.arrayContaining([SERVICE_PROVIDER_PROFILE_FEATURE, ACTIVE_BANKING_FEATURE]))
        })

        it('Should not duplicate active_banking feature if already exists', async () => {
            const [org] = await createTestOrganization(admin, { features: [ACTIVE_BANKING_FEATURE] })
            await syncFeatures({ context: ctx, organization: org, features: [] })

            const updatedOrg = await Organization.getOne(admin, { id: org.id })
            expect(updatedOrg).toHaveProperty('features')
            expect(updatedOrg.features.filter(f => f === ACTIVE_BANKING_FEATURE)).toHaveLength(1)
        })
    })
})