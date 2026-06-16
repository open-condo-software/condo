/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, setFeatureFlag } = require('@open-condo/keystone/test.utils')

const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const {
    SubscriptionPlan,
    createTestSubscriptionPlan,
    createTestSubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')

const { getOrganizationsSubscriptionMap } = require('./getOrganizationsSubscriptionMap')

const { keystone } = index

describe('getOrganizationsSubscriptionMap', () => {
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

    it('returns Map with true when organization has active subscription', async () => {
        const [organization] = await registerNewOrganization(admin)
        await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
            startAt: dayjs().format('YYYY-MM-DD'),
            endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
        })

        const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id])

        expect(result.get(organization.id)).toBe(true)
    })

    it('returns Map with false when subscription is expired', async () => {
        const [organization] = await registerNewOrganization(admin)
        await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
            startAt: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
            endAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
        })

        const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id])

        expect(result.get(organization.id)).toBe(false)
    })

    it('returns Map with false when organization has no subscription context', async () => {
        const [organization] = await registerNewOrganization(admin)

        const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id])

        expect(result.get(organization.id)).toBe(false)
    })

    it('returns empty Map for empty input', async () => {
        const result = await getOrganizationsSubscriptionMap(adminContext, [])

        expect(result.size).toBe(0)
    })

    it('returns correct Map for multiple organizations', async () => {
        const [org1] = await registerNewOrganization(admin)
        const [org2] = await registerNewOrganization(admin)
        await createTestSubscriptionContext(admin, org1, subscriptionPlan, {
            startAt: dayjs().format('YYYY-MM-DD'),
            endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
        })

        const result = await getOrganizationsSubscriptionMap(adminContext, [org1.id, org2.id])

        expect(result.get(org1.id)).toBe(true)
        expect(result.get(org2.id)).toBe(false)
    })

    describe('chunking', () => {
        it('queries Organization.getAll in chunks of 100', async () => {
            const spy = jest.spyOn(Organization, 'getAll').mockResolvedValue([])

            const ids = Array.from({ length: 250 }, (_, i) => `org-${i}`)
            await getOrganizationsSubscriptionMap(adminContext, ids)

            expect(spy).toHaveBeenCalledTimes(3)
            expect(spy.mock.calls[0][1].id_in).toHaveLength(100)
            expect(spy.mock.calls[1][1].id_in).toHaveLength(100)
            expect(spy.mock.calls[2][1].id_in).toHaveLength(50)

            spy.mockRestore()
        })
    })

    describe('condition parameter', () => {
        let planWithMeters, planWithPayments

        beforeAll(async () => {
            const [pm] = await createTestSubscriptionPlan(admin, { meters: true })
            planWithMeters = pm
            const [pp] = await createTestSubscriptionPlan(admin, { payments: true })
            planWithPayments = pp
        })

        afterAll(async () => {
            await SubscriptionPlan.softDelete(admin, planWithMeters.id)
            await SubscriptionPlan.softDelete(admin, planWithPayments.id)
        })

        it('returns true for meters condition when org has active meters subscription', async () => {
            const [organization] = await registerNewOrganization(admin)
            await createTestSubscriptionContext(admin, organization, planWithMeters, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })

            const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id], 'meters')

            expect(result.get(organization.id)).toBe(true)
        })

        it('returns false for meters condition when plan does not include meters', async () => {
            const [organization] = await registerNewOrganization(admin)
            await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })

            const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id], 'meters')

            expect(result.get(organization.id)).toBe(false)
        })

        it('returns true for payments condition when org has active payments subscription', async () => {
            const [organization] = await registerNewOrganization(admin)
            await createTestSubscriptionContext(admin, organization, planWithPayments, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })

            const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id], 'payments')

            expect(result.get(organization.id)).toBe(true)
        })

        it('returns true for multiple conditions when all are satisfied', async () => {
            const [planBoth] = await createTestSubscriptionPlan(admin, { meters: true, payments: true })
            const [organization] = await registerNewOrganization(admin)
            await createTestSubscriptionContext(admin, organization, planBoth, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })

            const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id], ['meters', 'payments'])

            expect(result.get(organization.id)).toBe(true)

            await SubscriptionPlan.softDelete(admin, planBoth.id)
        })

        it('returns false for multiple conditions when only one is satisfied', async () => {
            const [organization] = await registerNewOrganization(admin)
            await createTestSubscriptionContext(admin, organization, planWithMeters, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })

            const result = await getOrganizationsSubscriptionMap(adminContext, [organization.id], ['meters', 'payments'])

            expect(result.get(organization.id)).toBe(false)
        })
    })
})
