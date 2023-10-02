/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { sendVerificationDateReminder } = require('@condo/domains/meter/tasks/sendVerificationDateReminder')
const { METER_VERIFICATION_DATE_REMINDER_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message: MessageApi } = require('@condo/domains/notification/utils/serverSchema')


const { makeClientWithResidentAndMeter } = require('../utils/testSchema')


const { keystone } = index

const getNotificationsFromMeter = async ({ verificationDate, nextVerificationDate, searchWindowDaysShift = 0 }) => {
    const { user: { id } } = await makeClientWithResidentAndMeter({ verificationDate, nextVerificationDate })

    await sendVerificationDateReminder({ date: null, searchWindowDaysShift, daysCount: 30 })

    return await MessageApi.getAll(keystone, { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE })
}

describe('Meter verification notification', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })

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
        const messages = await MessageApi.getAll(keystone, { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE })
        expect(messages).toHaveLength(1)
    })

    it('should not send 60 days notification on next day if already sent 60 day notification yesterday', async () => {
        const { resident: { user: { id } } } = await makeClientWithResidentAndMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('45', 'day').toISOString(),
        })
        await sendVerificationDateReminder({ date: null, searchWindowDaysShift: 30, daysCount: 30 })
        await sendVerificationDateReminder({ date: dayjs().add(1, 'day').toISOString(), searchWindowDaysShift: 30, daysCount: 30 })
        const messages = await MessageApi.getAll(keystone, { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE })
        expect(messages).toHaveLength(1)
    })

    it('should send 60 days reminder then 30 days reminder', async () => {
        const { resident: { user: { id } } } = await makeClientWithResidentAndMeter({
            verificationDate: dayjs().subtract('1', 'year').toISOString(),
            nextVerificationDate: dayjs().add('45', 'day').toISOString(),
        })
        await sendVerificationDateReminder({ date: null, searchWindowDaysShift: 30, daysCount: 30 })
        await sendVerificationDateReminder({ date: dayjs().add(35, 'day').toISOString(), searchWindowDaysShift: 0, daysCount: 30 })
        const messages = await MessageApi.getAll(keystone, { user: { id }, type: METER_VERIFICATION_DATE_REMINDER_TYPE })
        expect(messages).toHaveLength(2)
    })
})