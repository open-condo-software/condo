const { syncSubscriptions } = require('./syncSubscriptions')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { prepareKeystoneExpressApp, setFakeClientMode } = require('@core/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { find } = require('lodash')
const { catchErrorFrom } = require('@condo/domains/common/utils/testSchema')
const { SUBSCRIPTION_TYPE, SUBSCRIPTION_TRIAL_PERIOD_DAYS } = require('@condo/domains/subscription/constants')
const dayjs = require('dayjs')

const firstInn = '7784523718'
const secondInn = '1234567890'

const mockActiveSubscriptionResponse = {
    activeSubscription: (inn) => JSON.parse(`[{"payerInn":"${inn}","payerAccount":"40702810738203653934","payerBankBic":"044525225","payerBankCorrAccount":"30101810400000000225","purpose":"оплата подпики за сервис по договору ХХХ от 22.22.2222","payerOrgIdHash":"8c80ef870028888bc444c27ba90873619cc7a6c99febd89f0e9fee155219b752","payerName":"ООО \\"ТО-Партнер-626-01\\"","sinceDate":"2021-10-05","untilDate":null,"active":true,"bundles":null}]`),
    noSubscriptions: [],
    canceledSubscription: (inn) => JSON.parse(`[{"payerInn":"${inn}","payerAccount":"40702810738203653934","payerBankBic":"044525225","payerBankCorrAccount":"30101810400000000225","purpose":"оплата подпики за сервис по договору ХХХ от 22.22.2222","payerOrgIdHash":"8c80ef870028888bc444c27ba90873619cc7a6c99febd89f0e9fee155219b752","payerName":"ООО \\"ТО-Партнер-626-01\\"","sinceDate":"2021-10-05","untilDate":null,"active":false,"bundles":null}]`),
}

const mockResponseFromFintechApi = {
    advanceAcceptances: () => {},
}

jest.mock('../SbbolRequestApi')
jest.mock('../SbbolFintechApi', () => ({
    SbbolFintechApi: jest.fn().mockImplementation(() => ({
        fetchAdvanceAcceptances: () => { return mockResponseFromFintechApi.advanceAcceptances() },
    })),
}))

let keystone

describe('syncSubscriptions', () => {
    setFakeClientMode(require.resolve('../../../../../index'))

    beforeAll(async () => {
        const result = await prepareKeystoneExpressApp(require.resolve('../../../../../index'))
        keystone = result.keystone
    })


    describe('arguments validation', () => {
        it('throws error if "context" argument is not specified', async () => {
            await catchErrorFrom(async () => {
                await syncSubscriptions({ })
            }, (error) => {
                expect(error.message).toEqual('context is not specified')
            })
        })

        it('throws error if "date" argument is not specified', async () => {
            const adminContext = await keystone.createContext({ skipAccessControl: true })
            const context = {
                keystone,
                context: adminContext,
            }

            await catchErrorFrom(async () => {
                await syncSubscriptions({ context })
            }, (error) => {
                expect(error.message).toEqual('date is not specified')
            })
        })
    })

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
            const context = {
                keystone,
                context: adminContext,
            }

            const [initialDefaultTrialSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.DEFAULT,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            await syncSubscriptions({ context, date: today.format('YYYY-MM-DD') })

            const subscriptions = await ServiceSubscription.getAll(adminContext, {
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })
            expect(subscriptions).toHaveLength(2)

            const trialSubscriptionAfterSync = find(subscriptions, { type: SUBSCRIPTION_TYPE.DEFAULT })
            expect(dayjs(trialSubscriptionAfterSync.finishAt).isBefore(dayjs(initialDefaultTrialSubscription.finishAt))).toBeTruthy()
            expect(dayjs(trialSubscriptionAfterSync.finishAt).isSame(today, 'minute')).toBeTruthy()

            const sbbolSubscriptionAfterSync = find(subscriptions, { type: SUBSCRIPTION_TYPE.SBBOL })
            expect(dayjs(sbbolSubscriptionAfterSync.startAt).isSame(today, 'minute')).toBeTruthy()
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
            const context = {
                keystone,
                context: adminContext,
            }

            const [initialDefaultTrialSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.DEFAULT,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            await syncSubscriptions({ context, date: today.format('YYYY-MM-DD') })

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
            const context = {
                keystone,
                context: adminContext,
            }

            await syncSubscriptions({ context, date: today.format('YYYY-MM-DD') })

            const [currentSbbolSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription).toBeDefined()

            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.canceledSubscription(firstInn)

            await syncSubscriptions({ context, date: today.format('YYYY-MM-DD') })

            const [changedSbbolSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription.id).toEqual(changedSbbolSubscription.id)
            expect(dayjs(changedSbbolSubscription.finishAt).isSame(today, 'minute')).toBeTruthy()
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
            const context = {
                keystone,
                context: adminContext,
            }

            await syncSubscriptions({ context, date: today.format('YYYY-MM-DD') })

            const [currentSbbolSubscription] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription).toBeDefined()

            mockResponseFromFintechApi.advanceAcceptances = () => mockActiveSubscriptionResponse.canceledSubscription(secondInn)

            await syncSubscriptions({ context, date: today.format('YYYY-MM-DD') })

            const [sbbolSubscriptionAfterSync] = await ServiceSubscription.getAll(adminContext, {
                type: SUBSCRIPTION_TYPE.SBBOL,
                organization: { id: organization.id },
            }, { sortBy: ['updatedAt_DESC'] })

            expect(currentSbbolSubscription).toMatchObject(sbbolSubscriptionAfterSync)
        })
    })
})