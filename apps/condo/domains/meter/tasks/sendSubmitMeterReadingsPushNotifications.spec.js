/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { sendSubmitMeterReadingsPushNotifications } = require('@condo/domains/meter/tasks/sendSubmitMeterReadingsPushNotifications')
const {
    MeterReadingSource,
    createTestMeterReading,
    createTestMeterReportingPeriod, createTestMeter, MeterResource,
} = require('@condo/domains/meter/utils/testSchema')
const {
    METER_SUBMIT_READINGS_REMINDER_TYPE,
    METER_SUBMIT_READINGS_REMINDER_START_PERIOD_TYPE,
    METER_SUBMIT_READINGS_REMINDER_END_PERIOD_TYPE,
    METER_VERIFICATION_DATE_EXPIRED_TYPE,
    CALL_METER_READING_SOURCE_ID,
} = require('@condo/domains/notification/constants/constants')
const { Message: MessageApi } = require('@condo/domains/notification/utils/serverSchema')
const { makeClientWithServiceConsumer } = require('@condo/domains/resident/utils/testSchema')



const { keystone } = index

const prepareUserAndMeter = async ({ nextVerificationDate }) => {
    const client = await makeClientWithServiceConsumer()
    const adminClient = await makeLoggedInAdminClient()
    const { property, organization, serviceConsumer, resident } = client
    const [resource] = await MeterResource.getAll(adminClient, {})
    client.resource = resource
    const [meter, attrs] = await createTestMeter(adminClient, organization, property, resource, {
        accountNumber: serviceConsumer.accountNumber,
        unitName: resident.unitName,
        verificationDate: dayjs().add(-1, 'year').toISOString(),
        nextVerificationDate,
    })
    client.meterAttrs = attrs
    client.meter = meter

    client.reportingPeriod = await createTestMeterReportingPeriod(adminClient, client.meter.organization, {
        notifyStartDay: Number(dayjs().format('DD')),
        notifyEndDay: 31,
    })

    return client
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
        type_in: [
            METER_SUBMIT_READINGS_REMINDER_TYPE,
            METER_SUBMIT_READINGS_REMINDER_START_PERIOD_TYPE,
            METER_SUBMIT_READINGS_REMINDER_END_PERIOD_TYPE,
            METER_VERIFICATION_DATE_EXPIRED_TYPE,
        ],
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