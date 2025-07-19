/**
 * @jest-environment node
 */

const mockWarn = jest.fn()

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_TYPE, SUBSCRIPTION_SBBOL_PERIOD_DAYS } = require('@condo/domains/subscription/constants')
const { ServiceSubscription, createTestServiceSubscription } = require('@condo/domains/subscription/utils/testSchema')

const { syncServiceSubscriptions } = require('./syncServiceSubscriptions')


jest.mock('@open-condo/keystone/logging', () => {
    const originalModule = jest.requireActual('@open-condo/keystone/logging')
    const loggerMock = {
        warn: mockWarn,
        info: jest.fn(),
        error: jest.fn(),
    }
    return {
        ...originalModule,
        getLogger: () => ({
            ...loggerMock,
            child: () => loggerMock,
        }),
    }
})

let adminClient

describe('syncSubscriptions', () => {
    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('One active ServiceSubscription with type "default" exist', () => {
        it('stops it and creates new ServiceSubscription with type "sbbol"', async () => {
            const [organization] = await createTestOrganization(adminClient)

            const [defaultServiceSubscription] = await createTestServiceSubscription(adminClient, organization, {
                type: SUBSCRIPTION_TYPE.DEFAULT,
            })

            await syncServiceSubscriptions(organization.tin)

            const now = dayjs()

            const subscriptions = await ServiceSubscription.getAll(adminClient, {
                organization: { id: organization.id },
            }, { sortBy: ['createdAt_ASC'] })

            expect(subscriptions).toHaveLength(2)

            const [defaultServiceSubscriptionAfterSync, newSbbolSubscription] = subscriptions
            expect(defaultServiceSubscriptionAfterSync.type).toEqual(SUBSCRIPTION_TYPE.DEFAULT)
            // Check reset ending of subscription via setting `finishAt` to current time instead of finishing time, that was initially supposed
            expect(dayjs(defaultServiceSubscriptionAfterSync.finishAt).isBefore(dayjs(defaultServiceSubscription.finishAt))).toBeTruthy()
            // Suppose that on a second frame the function
            expect(dayjs(defaultServiceSubscriptionAfterSync.finishAt).diff(now, 'second')).toEqual(0)

            expect(newSbbolSubscription.type).toEqual(SUBSCRIPTION_TYPE.SBBOL)
            expect(dayjs(newSbbolSubscription.finishAt).diff(dayjs(newSbbolSubscription.startAt), 'day')).toEqual(SUBSCRIPTION_SBBOL_PERIOD_DAYS)
        })

        it('does not affects subscriptions of other organization', async () => {
            const [organization] = await createTestOrganization(adminClient)
            const [otherOrganization] = await createTestOrganization(adminClient)

            await createTestServiceSubscription(adminClient, organization, {
                type: SUBSCRIPTION_TYPE.DEFAULT,
            })

            const [otherOrganizationSubscription] = await createTestServiceSubscription(adminClient, otherOrganization, {
                type: SUBSCRIPTION_TYPE.DEFAULT,
            })

            await syncServiceSubscriptions(organization.tin)

            const otherOrganizationSubscriptionsAfterSync = await ServiceSubscription.getAll(adminClient, {
                organization: { id: otherOrganization.id },
            }, { sortBy: ['createdAt_ASC'] })

            expect(otherOrganizationSubscriptionsAfterSync).toHaveLength(1)
            expect(otherOrganizationSubscriptionsAfterSync[0]).toMatchObject(otherOrganizationSubscription)
        })
    })

    describe('Active ServiceSubscription with type "sbbol" exist', () => {
        it('does nothing', async () => {
            const [organization] = await createTestOrganization(adminClient)

            const [sbbolServiceSubscription] = await createTestServiceSubscription(adminClient, organization, {
                type: SUBSCRIPTION_TYPE.SBBOL,
            })

            await syncServiceSubscriptions(organization.tin)

            const subscriptions = await ServiceSubscription.getAll(adminClient, {
                organization: { id: organization.id },
            }, { sortBy: ['createdAt_ASC'] })

            expect(subscriptions).toHaveLength(1)
            expect(subscriptions[0]).toEqual(sbbolServiceSubscription)
        })
    })

    describe('Organization not found', () => {
        it('logs warning and does nothing', async () => {
            const now = dayjs()
            const [organization] = await createTestOrganization(adminClient)

            const tin = organization.tin + '-9999999'
            await syncServiceSubscriptions(tin)

            expect(mockWarn).lastCalledWith(
                expect.objectContaining({
                    msg: 'not found organization to sync ServiceSubscription for',
                    data: { tin },
                }),
            )

            const updatedSubscriptions = await ServiceSubscription.getAll(adminClient, {
                updatedAt_gt: now.toISOString(),
            })
            const createdSubscriptions = await ServiceSubscription.getAll(adminClient, {
                createdAt_gt: now.toISOString(),
            })

            expect(updatedSubscriptions).toHaveLength(0)
            expect(createdSubscriptions).toHaveLength(0)
        })
    })
})