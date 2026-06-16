/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, setFeatureFlag } = require('@open-condo/keystone/test.utils')

const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const { sendVerificationDateReminder } = require('@condo/domains/meter/tasks/sendVerificationDateReminder')
const { METER_VERIFICATION_DATE_REMINDER_TYPE } = require('@condo/domains/notification/constants/constants')
const { MESSAGE_FIELDS } = require('@condo/domains/notification/gql')
const { Message: MessageApi } = require('@condo/domains/notification/utils/serverSchema')
const {
    SubscriptionPlan,
    createTestSubscriptionPlan,
    createTestSubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')

const { makeClientWithResidentAndMeter } = require('../utils/testSchema')


const { keystone } = index

const getNotificationsFromMeter = async ({ verificationDate, nextVerificationDate, searchWindowDaysShift = 0 }) => {
    const { user: { id } } = await makeClientWithResidentAndMeter({ verificationDate, nextVerificationDate })

    await sendVerificationDateReminder({ date: null, searchWindowDaysShift, daysCount: 30 })

    return await MessageApi.getAll(keystone,
        { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE },
        MESSAGE_FIELDS,
    )
}

describe('Meter verification notification', () => {
    setFakeClientMode(index)

    it('should not send messages on null nextVerificationDate', async () => {
        const messages = await getNotificationsFromMeter({
            verificationDate: null,
            nextVerificationDate: null,
        })
        expect(messages).toHaveLength(0)
    })

    it('should not send messages on equal verificationDate and nextVerificationDate', async () => {
        const now = new Date()
        const messages = await getNotificationsFromMeter({
            verificationDate: dayjs(now).add('25', 'day').toISOString(),
            nextVerificationDate: dayjs(now).add('25', 'day').toISOString(),
        })
        expect(messages).toHaveLength(0)
    })

    it('should not send messages if verificationDate is set and nextVerificationDate is null', async () => {
        const now = new Date()
        const messages = await getNotificationsFromMeter({
            verificationDate: dayjs(now).add('25', 'day').toISOString(),
            nextVerificationDate: null,
        })
        expect(messages).toHaveLength(0)
    })

    it('should not send messages if verificationDate is greater then nextVerificationDate', async () => {
        const messages = await getNotificationsFromMeter({
            verificationDate: dayjs().add('25', 'day').toISOString(),
            nextVerificationDate: dayjs().add('24', 'day').toISOString(),
        })
        expect(messages).toHaveLength(0)
    })

    it('should not create notifications if verificationDate is too far', async () => {
        const messages = await getNotificationsFromMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('100', 'day').toISOString(),
        })
        expect(messages).toHaveLength(0)
    })

    it('should create 30 days remain notification', async () => {
        const messages = await getNotificationsFromMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('15', 'day').toISOString(),
        })
        expect(messages).toHaveLength(1)
    })

    it('should create 60 days remain notification', async () => {
        const messages = await getNotificationsFromMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('50', 'day').toISOString(),
            searchWindowDaysShift: 30,
        })
        expect(messages).toHaveLength(1)
    })

    it('should not send 30 days notification on next day if already sent 30 day notification yesterday', async () => {
        const { resident: { user: { id } } } = await makeClientWithResidentAndMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('15', 'day').toISOString(),
        })
        await sendVerificationDateReminder({ date: null, searchWindowDaysShift: 0, daysCount: 30 })
        await sendVerificationDateReminder({ date: dayjs().add(1, 'day').toISOString(), searchWindowDaysShift: 0, daysCount: 30 })
        const messages = await MessageApi.getAll(keystone,
            { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE },
            MESSAGE_FIELDS
        )
        expect(messages).toHaveLength(1)
    })

    it('should not send 60 days notification on next day if already sent 60 day notification yesterday', async () => {
        const { resident: { user: { id } } } = await makeClientWithResidentAndMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('45', 'day').toISOString(),
        })
        await sendVerificationDateReminder({ date: null, searchWindowDaysShift: 30, daysCount: 30 })
        await sendVerificationDateReminder({ date: dayjs().add(1, 'day').toISOString(), searchWindowDaysShift: 30, daysCount: 30 })
        const messages = await MessageApi.getAll(keystone,
            { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE },
            MESSAGE_FIELDS,
        )
        expect(messages).toHaveLength(1)
    })

    it('should send 60 days reminder then 30 days reminder', async () => {
        const { resident: { user: { id } } } = await makeClientWithResidentAndMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('45', 'day').toISOString(),
        })
        await sendVerificationDateReminder({ date: null, searchWindowDaysShift: 30, daysCount: 30 })
        await sendVerificationDateReminder({ date: dayjs().add(35, 'day').toISOString(), searchWindowDaysShift: 0, daysCount: 30 })
        const messages = await MessageApi.getAll(keystone,
            { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE },
            MESSAGE_FIELDS,
        )
        expect(messages).toHaveLength(2)
    })

    describe('subscription check', () => {
        let admin, planWithMeters

        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            const [plan] = await createTestSubscriptionPlan(admin, { meters: true })
            planWithMeters = plan
        })

        afterAll(async () => {
            await SubscriptionPlan.softDelete(admin, planWithMeters.id)
        })

        beforeEach(() => { setFeatureFlag(SUBSCRIPTIONS, true) })
        afterEach(() => { setFeatureFlag(SUBSCRIPTIONS, false) })

        it('should not send notification when organization has no active meters subscription', async () => {
            const { resident: { user: { id } } } = await makeClientWithResidentAndMeter({
                verificationDate: dayjs().subtract('1', 'year').toISOString(),
                nextVerificationDate: dayjs().add('15', 'day').toISOString(),
            })

            await sendVerificationDateReminder({ date: null, searchWindowDaysShift: 0, daysCount: 30 })

            const messages = await MessageApi.getAll(keystone,
                { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE },
                MESSAGE_FIELDS,
            )
            expect(messages).toHaveLength(0)
        })

        it('should send notification when organization has active meters subscription', async () => {
            const { resident: { user: { id } }, organization } = await makeClientWithResidentAndMeter({
                verificationDate: dayjs().subtract('1', 'year').toISOString(),
                nextVerificationDate: dayjs().add('15', 'day').toISOString(),
            })
            await createTestSubscriptionContext(admin, organization, planWithMeters, {
                startAt: dayjs().format('YYYY-MM-DD'),
                endAt: dayjs().add(1, 'month').format('YYYY-MM-DD'),
            })

            await sendVerificationDateReminder({ date: null, searchWindowDaysShift: 0, daysCount: 30 })

            const messages = await MessageApi.getAll(keystone,
                { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE },
                MESSAGE_FIELDS,
            )
            expect(messages).toHaveLength(1)
        })
    })
})