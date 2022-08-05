/**
 * @jest-environment node
 */

const dayjs = require('dayjs')

const { setFakeClientMode } = require('@core/keystone/test.utils')
const { sendSubmitMeterReadingsPushNotifications } = require('@condo/domains/meter/tasks/sendSubmitMeterReadingsPushNotifications')
const { Message: MessageApi } = require('@condo/domains/notification/utils/serverSchema')
const {
    METER_SUBMIT_READINGS_REMINDER_TYPE,
    METER_VERIFICATION_DATE_EXPIRED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const {
    MeterReadingSource,
    makeClientWithResidentAndMeter,
    createTestMeterReading,
} = require('@condo/domains/meter/utils/testSchema')
const { CALL_METER_READING_SOURCE_ID } = require('@condo/domains/meter/constants/constants')

const index = require('@app/condo/index')
const { keystone } = index

const prepareUserAndMeter = async ({ nextVerificationDate }) => {
    return await makeClientWithResidentAndMeter({
        verificationDate: dayjs().add(-1, 'year').toISOString(),
        nextVerificationDate,
    })
}

const prepareReadings = async (client) => {
    const [source] = await MeterReadingSource.getAll(client, { id: CALL_METER_READING_SOURCE_ID })

    await createTestMeterReading(
        client,
        client.meter,
        source,
        {
            date: dayjs().toISOString(),
        }
    )
}

const getNewMessages = async ({ userId, meterId }) => {
    const messages = await MessageApi.getAll(keystone, {
        user: { id: userId },
        type_in: [METER_SUBMIT_READINGS_REMINDER_TYPE, METER_VERIFICATION_DATE_EXPIRED_TYPE],
    })
    return messages.filter(message => message.meta.data.meterId === meterId)
}

describe('Submit meter readings push notification', () => {
    setFakeClientMode(index)

    it('should not send messages for exists this month readings and valid nextVerificationDate', async () => {
        // arrange
        const client = await prepareUserAndMeter({
            nextVerificationDate: dayjs().add(1, 'day').toISOString(),
        })
        await prepareReadings(client)

        // act
        await sendSubmitMeterReadingsPushNotifications()

        // assert
        const messages = await getNewMessages({
            userId: client.user.id,
            meterId: client.meter.id,
        })
        expect(messages).toHaveLength(0)
    })

    it('should not send messages for exists this month readings and not valid nextVerificationDate', async () => {
        // arrange
        const client = await prepareUserAndMeter({
            nextVerificationDate: dayjs().add(-1, 'day').toISOString(),
        })
        await prepareReadings(client)

        // act
        await sendSubmitMeterReadingsPushNotifications()

        // assert
        const messages = await getNewMessages({
            userId: client.user.id,
            meterId: client.meter.id,
        })
        expect(messages).toHaveLength(0)
    })

    it('should send messages for empty readings and valid nextVerificationDate', async () => {
        // arrange
        const { user, meter } = await prepareUserAndMeter({
            nextVerificationDate: dayjs().add(1, 'day').toISOString(),
        })

        // act
        await sendSubmitMeterReadingsPushNotifications()

        // assert
        const messages = await getNewMessages({
            userId: user.id,
            meterId: meter.id,
        })
        expect(messages).toHaveLength(1)
        expect(messages[0].organization.id).toEqual(meter.organization.id)
    })

    it('should send messages for empty readings and not valid nextVerificationDate', async () => {
        // arrange
        const { user, meter } = await prepareUserAndMeter({
            nextVerificationDate: dayjs().add(-1, 'day').toISOString(),
        })

        // act
        await sendSubmitMeterReadingsPushNotifications()

        // assert
        const messages = await getNewMessages({
            userId: user.id,
            meterId: meter.id,
        })
        expect(messages).toHaveLength(2)
        expect(messages[0].organization.id).toEqual(meter.organization.id)
        expect(messages[1].organization.id).toEqual(meter.organization.id)
    })

    it('should send messages for empty readings and undefined nextVerificationDate', async () => {
        // arrange
        const { user, meter } = await prepareUserAndMeter({
            nextVerificationDate: undefined,
        })

        // act
        await sendSubmitMeterReadingsPushNotifications()

        // assert
        const messages = await getNewMessages({
            userId: user.id,
            meterId: meter.id,
        })
        expect(messages).toHaveLength(1)
        expect(messages[0].organization.id).toEqual(meter.organization.id)
    })
})