/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, setFeatureFlag, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID } = require('@condo/domains/common/constants/featureflags')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestSubscriptionPlan, SubscriptionContext, createTestSubscriptionContext } = require('@condo/domains/subscription/utils/testSchema')

const { syncServiceSubscriptions } = require('./syncServiceSubscriptions')

const { keystone } = index

describe('syncServiceSubscriptions', () => {
    setFakeClientMode(index)

    let adminClient
    let context

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        const adminContext = await keystone.createContext({ skipAccessControl: true })
        context = adminContext
    })

    beforeEach(() => {
        setFeatureFlag(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID, null)
    })

    describe('Feature flag not configured', () => {
        it('does not create SubscriptionContext when feature flag is not configured', async () => {
            const [organization] = await createTestOrganization(adminClient)

            await syncServiceSubscriptions({ context: context, organization })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                deletedAt: null,
            })

            expect(contexts).toHaveLength(0)
        })
    })

    describe('SubscriptionContext creation', () => {
        it('creates SubscriptionContext when feature flag returns plan ID', async () => {
            const [organization] = await createTestOrganization(adminClient)
            const [subscriptionPlan] = await createTestSubscriptionPlan(adminClient)

            setFeatureFlag(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID, subscriptionPlan.id)

            await syncServiceSubscriptions({ context, organization })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlan: { id: subscriptionPlan.id },
                deletedAt: null,
            })

            expect(contexts).toHaveLength(1)
            expect(contexts[0]).toMatchObject({
                organization: { id: organization.id },
                subscriptionPlan: { id: subscriptionPlan.id },
                isTrial: false,
            })
            expect(contexts[0].endAt).toBeNull()
            expect(contexts[0].startAt).toBeDefined()
        })

        it('does not duplicate SubscriptionContext if active one already exists (endAt: null)', async () => {
            const [organization] = await createTestOrganization(adminClient)
            const [subscriptionPlan] = await createTestSubscriptionPlan(adminClient)

            setFeatureFlag(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID, subscriptionPlan.id)

            // First sync - should create context
            await syncServiceSubscriptions({ context, organization })

            // Second sync - should not create duplicate
            await syncServiceSubscriptions({ context, organization })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlan: { id: subscriptionPlan.id },
                deletedAt: null,
            })

            expect(contexts).toHaveLength(1)
        })

        it('creates new SubscriptionContext if existing one is expired (endAt < now)', async () => {
            const [organization] = await createTestOrganization(adminClient)
            const [subscriptionPlan] = await createTestSubscriptionPlan(adminClient)

            // Create existing expired context
            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                startAt: dayjs().subtract(60, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
                isTrial: true,
            })

            setFeatureFlag(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID, subscriptionPlan.id)

            await syncServiceSubscriptions({ context, organization })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlan: { id: subscriptionPlan.id },
                deletedAt: null,
            })

            // Should have 2 contexts: expired one and new one
            expect(contexts).toHaveLength(2)

            const activeContexts = contexts.filter(c => c.endAt === null)
            expect(activeContexts).toHaveLength(1)
        })
    })
})