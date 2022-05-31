/**
 * @jest-environment node
 */

const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { setFakeClientMode } = require('@core/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { find } = require('lodash')
const { SUBSCRIPTION_TYPE, SUBSCRIPTION_TRIAL_PERIOD_DAYS } = require('@condo/domains/subscription/constants')
const dayjs = require('dayjs')

const { syncSubscriptions } = require('./syncSubscriptions')

const index = require('@app/condo/index')
const { keystone } = index

const firstInn = '7784523718'
const secondInn = '1234567890'

const mockActiveSubscriptionResponse = {
    activeSubscription: (inn) => JSON.parse(`[{"payerInn":"${inn}","payerAccount":"40702810738203653934","payerBankBic":"044525225","payerBankCorrAccount":"30101810400000000225","purpose":"оплата подпики за сервис по договору ХХХ от 22.22.2222","payerOrgIdHash":"8c80ef870028888bc444c27ba90873619cc7a6c99febd89f0e9fee155219b752","payerName":"ООО \\"ТО-Партнер-626-01\\"","sinceDate":"2021-10-05","untilDate":null,"active":true,"bundles":null}]`),
    noSubscriptions: [],
    canceledSubscription: (inn) => JSON.parse(`[{"payerInn":"${inn}","payerAccount":"40702810738203653934","payerBankBic":"044525225","payerBankCorrAccount":"30101810400000000225","purpose":"оплата подпики за сервис по договору ХХХ от 22.22.2222","payerOrgIdHash":"8c80ef870028888bc444c27ba90873619cc7a6c99febd89f0e9fee155219b752","payerName":"ООО \\"ТО-Партнер-626-01\\"","sinceDate":"2021-10-05","untilDate":null,"active":false,"bundles":null}]`),
}

const mockResponseFromFintechApi = {
    advanceAcceptances: () => { throw Error('Please, implement a mock for this function, before using it')},
}

jest.mock('../SbbolRequestApi')
jest.mock('../SbbolFintechApi', () => ({
    initSbbolFintechApi: jest.fn().mockImplementation(() => ({
        fetchAdvanceAcceptances: () => { return mockResponseFromFintechApi.advanceAcceptances() },
    })),

}))


describe('syncSubscriptions', () => {
    setFakeClientMode(index)

    describe('Fintech API returns active offer for current organization', () => {
        beforeAll(() => {
            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.activeSubscription(firstInn)
        })

        it('creates new subscription and stops already active one', async () => {
            const today = dayjs()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, {
                meta: {
                    inn: firstInn,
                },
            })

            const adminContext = await keystone.createContext({ skipAccessControl: true })

            const [initialDefaultTrialSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.DEFAULT,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            await syncSubscriptions(today.format('YYYY-MM-DD'))

            const subscriptions = await ServiceSubscription.getAll(adminContext, {
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })
            expect(subscriptions).toHaveLength(2)

            const trialSubscriptionAfterSync = find(subscriptions, { type: SUBSCRIPTION_TYPE.DEFAULT })
            expect(dayjs(trialSubscriptionAfterSync.finishAt).isBefore(dayjs(initialDefaultTrialSubscription.finishAt))).toBeTruthy()
            expect(dayjs(trialSubscriptionAfterSync.finishAt).diff(today, 'minute')).toEqual(0)

            const sbbolSubscriptionAfterSync = find(subscriptions, { type: SUBSCRIPTION_TYPE.SBBOL })
            expect(dayjs(sbbolSubscriptionAfterSync.startAt).diff(today, 'minute')).toEqual(0)
            expect(dayjs(sbbolSubscriptionAfterSync.finishAt).diff(dayjs(sbbolSubscriptionAfterSync.startAt), 'day')).toEqual(SUBSCRIPTION_TRIAL_PERIOD_DAYS)
        })
    })

    describe('Fintech API returns empty offers array', () => {
        beforeAll(() => {
            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.noSubscriptions
        })

        it('does nothing', async () => {
            const today = dayjs()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, {
                meta: {
                    inn: firstInn,
                },
            })

            const adminContext = await keystone.createContext({ skipAccessControl: true })

            const [initialDefaultTrialSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.DEFAULT,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            await syncSubscriptions(today.format('YYYY-MM-DD'))

            const subscriptions = await ServiceSubscription.getAll(adminContext, {
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })
            expect(subscriptions).toHaveLength(1)

            expect(subscriptions[0]).toMatchObject(initialDefaultTrialSubscription)
        })
    })

    describe('Fintech API returns not active offer for current organization', () => {
        it('deactivates current sbbol subscription', async () => {
            const today = dayjs()
            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.activeSubscription(firstInn)

            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, {
                meta: {
                    inn: firstInn,
                },
            })

            const adminContext = await keystone.createContext({ skipAccessControl: true })

            await syncSubscriptions(today.format('YYYY-MM-DD'))

            const [currentSbbolSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription).toBeDefined()

            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.canceledSubscription(firstInn)

            await syncSubscriptions(today.format('YYYY-MM-DD'))

            const [changedSbbolSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription.id).toEqual(changedSbbolSubscription.id)
            expect(dayjs(changedSbbolSubscription.finishAt).diff(today, 'minute')).toEqual(0)
        })
    })

    describe('Fintech API returns not active offer for another organization', () => {
        it('does nothing with subscription of current organization', async () => {
            const today = dayjs()
            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.activeSubscription(firstInn)

            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(userClient, {
                meta: {
                    inn: firstInn,
                },
            })

            const adminContext = await keystone.createContext({ skipAccessControl: true })

            await syncSubscriptions(today.format('YYYY-MM-DD'))

            const [currentSbbolSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription).toBeDefined()

            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.canceledSubscription(secondInn)

            await syncSubscriptions(today.format('YYYY-MM-DD'))

            const [sbbolSubscriptionAfterSync] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription).toMatchObject(sbbolSubscriptionAfterSync)
        })
    })
})