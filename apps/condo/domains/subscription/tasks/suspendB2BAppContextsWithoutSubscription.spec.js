const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, setFeatureFlag } = require('@open-condo/keystone/test.utils')

const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const { CONTEXT_FINISHED_STATUS, CONTEXT_ERROR_STATUS, CONTEXT_ERROR_REASON_NO_SUBSCRIPTION } = require('@condo/domains/miniapp/constants')
const { createTestB2BApp, createTestB2BAppContext, B2BAppContext } = require('@condo/domains/miniapp/utils/testSchema')
const { HOLDING_TYPE, SERVICE_PROVIDER_TYPE } = require('@condo/domains/organization/constants/common')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_PLAN_TYPE_FEATURE } = require('@condo/domains/subscription/constants')
const { suspendB2BAppContextsWithoutSubscription } = require('@condo/domains/subscription/tasks/suspendB2BAppContextsWithoutSubscription')
const { createTestSubscriptionPlan, createTestSubscriptionContext } = require('@condo/domains/subscription/utils/testSchema')


describe('suspendB2BAppContextsWithoutSubscription', () => {
    setFakeClientMode(index)

    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('with enabled subscriptions', () => {
        beforeAll(() => {
            setFeatureFlag(SUBSCRIPTIONS, true)
        })

        afterAll(() => {
            setFeatureFlag(SUBSCRIPTIONS, false)
        })

        test('moves context to Error when organization has no subscription for the app', async () => {
            const [organization] = await registerNewOrganization(admin, { type: HOLDING_TYPE })
            const [app] = await createTestB2BApp(admin)
            await createTestSubscriptionPlan(admin, {
                name: faker.commerce.productName(),
                organizationType: HOLDING_TYPE,
                planType: SUBSCRIPTION_PLAN_TYPE_FEATURE,
                enabledB2BApps: [app.id],
            })
            const [b2bAppContext] = await createTestB2BAppContext(admin, app, organization, { status: CONTEXT_FINISHED_STATUS })

            await suspendB2BAppContextsWithoutSubscription()

            const suspendedContext = await B2BAppContext.getOne(admin, { id: b2bAppContext.id })
            expect(suspendedContext.status).toBe(CONTEXT_ERROR_STATUS)
            expect(suspendedContext.errorReason).toBe(CONTEXT_ERROR_REASON_NO_SUBSCRIPTION)
        })

        test('moves context to Error when subscription for the app is expired', async () => {
            const [organization] = await registerNewOrganization(admin, { type: HOLDING_TYPE })
            const [app] = await createTestB2BApp(admin)
            const [subscriptionPlan] = await createTestSubscriptionPlan(admin, {
                name: faker.commerce.productName(),
                organizationType: HOLDING_TYPE,
                enabledB2BApps: [app.id],
            })
            await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
                startAt: dayjs().subtract(60, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })
            const [b2bAppContext] = await createTestB2BAppContext(admin, app, organization, { status: CONTEXT_FINISHED_STATUS })

            await suspendB2BAppContextsWithoutSubscription()

            const suspendedContext = await B2BAppContext.getOne(admin, { id: b2bAppContext.id })
            expect(suspendedContext.status).toBe(CONTEXT_ERROR_STATUS)
            expect(suspendedContext.errorReason).toBe(CONTEXT_ERROR_REASON_NO_SUBSCRIPTION)
        })

        test('keeps context Finished when subscription for the app is active', async () => {
            const [organization] = await registerNewOrganization(admin, { type: HOLDING_TYPE })
            const [app] = await createTestB2BApp(admin)
            const [subscriptionPlan] = await createTestSubscriptionPlan(admin, {
                name: faker.commerce.productName(),
                organizationType: HOLDING_TYPE,
                enabledB2BApps: [app.id],
            })
            await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })
            const [b2bAppContext] = await createTestB2BAppContext(admin, app, organization, { status: CONTEXT_FINISHED_STATUS })

            await suspendB2BAppContextsWithoutSubscription()

            const notChangedContext = await B2BAppContext.getOne(admin, { id: b2bAppContext.id })
            expect(notChangedContext.status).toBe(CONTEXT_FINISHED_STATUS)
        })

        test('keeps context Finished when subscription for the app is in payment buffer period', async () => {
            const [organization] = await registerNewOrganization(admin, { type: HOLDING_TYPE })
            const [app] = await createTestB2BApp(admin)
            const [subscriptionPlan] = await createTestSubscriptionPlan(admin, {
                name: faker.commerce.productName(),
                organizationType: HOLDING_TYPE,
                enabledB2BApps: [app.id],
            })
            await createTestSubscriptionContext(admin, organization, subscriptionPlan, {
                startAt: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                isTrial: false,
            })
            const [b2bAppContext] = await createTestB2BAppContext(admin, app, organization, { status: CONTEXT_FINISHED_STATUS })

            await suspendB2BAppContextsWithoutSubscription()

            const notChangedContext = await B2BAppContext.getOne(admin, { id: b2bAppContext.id })
            expect(notChangedContext.status).toBe(CONTEXT_FINISHED_STATUS)
        })

        test('keeps context Finished when app is included only into plans for another organization type', async () => {
            const [organization] = await registerNewOrganization(admin, { type: HOLDING_TYPE })
            const [app] = await createTestB2BApp(admin)
            await createTestSubscriptionPlan(admin, {
                name: faker.commerce.productName(),
                organizationType: SERVICE_PROVIDER_TYPE,
                planType: SUBSCRIPTION_PLAN_TYPE_FEATURE,
                enabledB2BApps: [app.id],
            })
            const [b2bAppContext] = await createTestB2BAppContext(admin, app, organization, { status: CONTEXT_FINISHED_STATUS })

            await suspendB2BAppContextsWithoutSubscription()

            const notChangedContext = await B2BAppContext.getOne(admin, { id: b2bAppContext.id })
            expect(notChangedContext.status).toBe(CONTEXT_FINISHED_STATUS)
        })

        test('keeps context Finished when app is not included into any subscription plan', async () => {
            const [organization] = await registerNewOrganization(admin, { type: HOLDING_TYPE })
            const [app] = await createTestB2BApp(admin)
            const [b2bAppContext] = await createTestB2BAppContext(admin, app, organization, { status: CONTEXT_FINISHED_STATUS })

            await suspendB2BAppContextsWithoutSubscription()

            const notChangedContext = await B2BAppContext.getOne(admin, { id: b2bAppContext.id })
            expect(notChangedContext.status).toBe(CONTEXT_FINISHED_STATUS)
        })
    })

    describe('with disabled subscriptions', () => {
        beforeAll(() => {
            setFeatureFlag(SUBSCRIPTIONS, false)
        })

        test('keeps context Finished when subscriptions are disabled', async () => {
            const [organization] = await registerNewOrganization(admin, { type: HOLDING_TYPE })
            const [app] = await createTestB2BApp(admin)
            await createTestSubscriptionPlan(admin, {
                name: faker.commerce.productName(),
                organizationType: HOLDING_TYPE,
                planType: SUBSCRIPTION_PLAN_TYPE_FEATURE,
                enabledB2BApps: [app.id],
            })
            const [b2bAppContext] = await createTestB2BAppContext(admin, app, organization, { status: CONTEXT_FINISHED_STATUS })

            await suspendB2BAppContextsWithoutSubscription()

            const notChangedContext = await B2BAppContext.getOne(admin, { id: b2bAppContext.id })
            expect(notChangedContext.status).toBe(CONTEXT_FINISHED_STATUS)
        })
    })
})
