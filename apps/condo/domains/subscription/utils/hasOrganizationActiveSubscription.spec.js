/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, setFeatureFlag } = require('@open-condo/keystone/test.utils')

const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const {
    SubscriptionPlan,
    createTestSubscriptionPlan,
    createTestSubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')

const { hasOrganizationActiveSubscription } = require('./hasOrganizationActiveSubscription')

const { keystone } = index

describe('hasOrganizationActiveSubscription', () => {
    setFakeClientMode(index)

    let adminContext, admin, subscriptionPlan

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })
        admin = await makeLoggedInAdminClient()
        setFeatureFlag(SUBSCRIPTIONS, true)
        const [plan] = await createTestSubscriptionPlan(admin)
        subscriptionPlan = plan
    })

    afterAll(async () => {
        await SubscriptionPlan.softDelete(admin, subscriptionPlan.id)
        setFeatureFlag(SUBSCRIPTIONS, false)
    })

    it('returns true when organization has active subscription', async () => {
        const [organization] = await registerNewOrganization(admin)
        await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
            startAt: dayjs().format('YYYY-MM-DD'),
            endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
        })

        const result = await hasOrganizationActiveSubscription(adminContext, organization.id)

        expect(result).toBe(true)
    })

    it('returns false when subscription is expired', async () => {
        const [organization] = await registerNewOrganization(admin)
        await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
            startAt: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
            endAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
        })

        const result = await hasOrganizationActiveSubscription(adminContext, organization.id)

        expect(result).toBe(false)
    })

    it('returns false when organization has no subscription context', async () => {
        const [organization] = await registerNewOrganization(admin)

        const result = await hasOrganizationActiveSubscription(adminContext, organization.id)

        expect(result).toBe(false)
    })

    describe('cache', () => {
        it('returns same value on second call without extra query', async () => {
            const [organization] = await registerNewOrganization(admin)
            await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })
            const cache = new Map()

            const first = await hasOrganizationActiveSubscription(adminContext, organization.id, cache)
            const second = await hasOrganizationActiveSubscription(adminContext, organization.id, cache)

            expect(first).toBe(true)
            expect(second).toBe(first)
        })

        it('stores result in cache after first call', async () => {
            const [organization] = await registerNewOrganization(admin)
            const cache = new Map()

            const result = await hasOrganizationActiveSubscription(adminContext, organization.id, cache)

            expect(cache.has(organization.id)).toBe(true)
            expect(cache.get(organization.id)).toBe(result)
        })

        it('uses pre-populated cache value without querying organization', async () => {
            const cache = new Map([['pre-populated-org-id', true]])

            const result = await hasOrganizationActiveSubscription(adminContext, 'pre-populated-org-id', cache)

            expect(result).toBe(true)
        })
    })
})
