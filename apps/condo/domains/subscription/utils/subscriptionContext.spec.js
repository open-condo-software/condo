/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { MANAGING_COMPANY_TYPE } = require('@condo/domains/organization/constants/common')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const {
    SubscriptionContext,
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    createTestSubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const {
    selectBestSubscriptionContext,
    calculateSubscriptionStartDate,
} = require('./subscriptionContext')

describe('subscriptionContext', () => {
    setFakeClientMode(index)

    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('selectBestSubscriptionContext', () => {
        test('returns single context', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient, { priority: 1 })

            const [createdContext] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'day').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context] = await SubscriptionContext.getAll(adminClient, { id: createdContext.id })

            expect(selectBestSubscriptionContext([context])).toMatchObject({ id: context.id })
        })

        test('selects context with higher plan priority', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [lowPriorityPlan] = await createTestSubscriptionPlan(adminClient, { priority: 1 })
            const [highPriorityPlan] = await createTestSubscriptionPlan(adminClient, { priority: 5 })

            const startAt = dayjs().format('YYYY-MM-DD')
            const endAt = dayjs().add(30, 'day').format('YYYY-MM-DD')

            const [createdLow] = await createTestSubscriptionContext(adminClient, organization, lowPriorityPlan, {
                startAt,
                endAt,
                isTrial: false,
            })

            const [createdHigh] = await createTestSubscriptionContext(adminClient, organization, highPriorityPlan, {
                startAt,
                endAt,
                isTrial: false,
            })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                id_in: [createdLow.id, createdHigh.id],
            })

            const result1 = selectBestSubscriptionContext(contexts)
            const result2 = selectBestSubscriptionContext([...contexts].reverse())

            expect(result1.subscriptionPlan.priority).toBe(5)
            expect(result2.subscriptionPlan.priority).toBe(5)
        })

        test('prefers non-trial over trial when priorities are equal', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient, { priority: 3 })

            const startAt = dayjs().format('YYYY-MM-DD')
            const endAt = dayjs().add(30, 'day').format('YYYY-MM-DD')

            const [createdTrial] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt,
                endAt,
                isTrial: true,
            })

            const [createdNonTrial] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt,
                endAt,
                isTrial: false,
            })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                id_in: [createdTrial.id, createdNonTrial.id],
            })

            const result1 = selectBestSubscriptionContext(contexts)
            const result2 = selectBestSubscriptionContext([...contexts].reverse())

            expect(result1.isTrial).toBe(false)
            expect(result2.isTrial).toBe(false)
        })

        test('prefers later startAt when priority and trial status are equal', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient, { priority: 2 })

            const earlierStart = dayjs().format('YYYY-MM-DD')
            const earlierEnd = dayjs().add(30, 'day').format('YYYY-MM-DD')
            const laterStart = dayjs().add(31, 'day').format('YYYY-MM-DD')
            const laterEnd = dayjs().add(60, 'day').format('YYYY-MM-DD')

            const [createdEarlier] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: earlierStart,
                endAt: earlierEnd,
                isTrial: false,
            })

            const [createdLater] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: laterStart,
                endAt: laterEnd,
                isTrial: false,
            })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                id_in: [createdEarlier.id, createdLater.id],
            })

            const result1 = selectBestSubscriptionContext(contexts)
            const result2 = selectBestSubscriptionContext([...contexts].reverse())

            expect(result1.startAt).toBe(laterStart)
            expect(result2.startAt).toBe(laterStart)
        })

        test('complex scenario with multiple criteria', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            
            const [plan1] = await createTestSubscriptionPlan(adminClient, { priority: 1 })
            const [plan3] = await createTestSubscriptionPlan(adminClient, { priority: 3 })
            const [plan5] = await createTestSubscriptionPlan(adminClient, { priority: 5 })

            const [created1] = await createTestSubscriptionContext(adminClient, organization, plan1, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'day').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [created2] = await createTestSubscriptionContext(adminClient, organization, plan3, {
                startAt: dayjs().add(60, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(90, 'day').format('YYYY-MM-DD'),
                isTrial: true,
            })

            const [created3] = await createTestSubscriptionContext(adminClient, organization, plan3, {
                startAt: dayjs().add(30, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(60, 'day').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [created4] = await createTestSubscriptionContext(adminClient, organization, plan5, {
                startAt: dayjs().add(15, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(45, 'day').format('YYYY-MM-DD'),
                isTrial: true,
            })

            const contexts = await SubscriptionContext.getAll(adminClient, {
                id_in: [created1.id, created2.id, created3.id, created4.id],
            })

            const result = selectBestSubscriptionContext(contexts)
            expect(result.subscriptionPlan.priority).toBe(5)
            expect(result.isTrial).toBe(true)
        })
    })

    describe('calculateSubscriptionStartDate', () => {
        test('returns today when all contexts end in the past', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient)

            const [context1] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().subtract(40, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(10, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context2] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().subtract(9, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(5, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const result = calculateSubscriptionStartDate([context1, context2])
            const today = dayjs().startOf('day')

            expect(result.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'))
        })

        test('returns latest endAt when it is in the future', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient)

            const futureEndAt = dayjs().add(30, 'days').format('YYYY-MM-DD')

            const [context1] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().subtract(20, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().add(10, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context2] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().add(11, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().add(20, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context3] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().add(21, 'days').format('YYYY-MM-DD'),
                endAt: futureEndAt,
                isTrial: false,
            })

            const result = calculateSubscriptionStartDate([context1, context2, context3])

            expect(result.format('YYYY-MM-DD')).toBe(futureEndAt)
        })

        test('selects latest endAt from multiple future dates', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient)

            const latestEndAt = dayjs().add(90, 'days').format('YYYY-MM-DD')

            const [context1] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context2] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().add(60, 'days').format('YYYY-MM-DD'),
                endAt: latestEndAt,
                isTrial: false,
            })

            const [context3] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().add(60, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const result = calculateSubscriptionStartDate([context1, context2, context3])

            expect(result.format('YYYY-MM-DD')).toBe(latestEndAt)
        })

        test('returns today when endAt equals today', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient)

            const today = dayjs().startOf('day').format('YYYY-MM-DD')

            const [context] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
                endAt: today,
                isTrial: false,
            })

            const result = calculateSubscriptionStartDate([context])

            expect(result.format('YYYY-MM-DD')).toBe(today)
        })

        test('handles mix of past, today, and future endAt dates', async () => {
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, { type: MANAGING_COMPANY_TYPE })
            const [plan] = await createTestSubscriptionPlan(adminClient)

            const futureEndAt = dayjs().add(45, 'days').format('YYYY-MM-DD')

            const [context1] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().subtract(40, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(10, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context2] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().subtract(9, 'days').format('YYYY-MM-DD'),
                endAt: dayjs().format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context3] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().add(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(20, 'days').format('YYYY-MM-DD'),
                isTrial: false,
            })

            const [context4] = await createTestSubscriptionContext(adminClient, organization, plan, {
                startAt: dayjs().add(21, 'days').format('YYYY-MM-DD'),
                endAt: futureEndAt,
                isTrial: false,
            })

            const result = calculateSubscriptionStartDate([context1, context2, context3, context4])

            expect(result.format('YYYY-MM-DD')).toBe(futureEndAt)
        })
    })
})

