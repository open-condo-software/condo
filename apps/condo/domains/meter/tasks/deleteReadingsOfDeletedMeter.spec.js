/**
 * @jest-environment node
 */

const { CALL_METER_READING_SOURCE_ID, COLD_WATER_METER_RESOURCE_ID } = require('@condo/domains/meter/constants/constants')
const {
    MeterReadingSource,
    createTestMeterReading, MeterResource, createTestMeter, updateTestMeter,
} = require('@condo/domains/meter/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')

describe('deleteReadingsOfDeletedMeter', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })

    it('readings are deleted after the related meter is deleted', async () => {
        const client = await makeClientWithProperty()

        const [source] = await MeterReadingSource.getAll(client, { id: CALL_METER_READING_SOURCE_ID })
        const [resource] = await MeterResource.getAll(client, { id: COLD_WATER_METER_RESOURCE_ID })
        const [meter] = await createTestMeter(client, client.organization, client.property, resource, {})
        const [meterReading1] = await createTestMeterReading(client, meter, source)
        const [meterReading2] = await createTestMeterReading(client, meter, source)

        expect(meterReading1.deletedAt).toBeNull()
        expect(meterReading2.deletedAt).toBeNull()

        await updateTestMeter(client, meter.id, {
            deletedAt: new Date(),
        })

        expect(meterReading1.deletedAt).toBeDefined()
        expect(meterReading2.deletedAt).toBeDefined()
    })

    it('readings are not deleted after the not related meter is deleted', async () => {
        const client = await makeClientWithProperty()

        const [source] = await MeterReadingSource.getAll(client, { id: CALL_METER_READING_SOURCE_ID })
        const [resource] = await MeterResource.getAll(client, { id: COLD_WATER_METER_RESOURCE_ID })
        const [meter] = await createTestMeter(client, client.organization, client.property, resource, {})
        const [meter1] = await createTestMeter(client, client.organization, client.property, resource, {})
        const [meterReading1] = await createTestMeterReading(client, meter, source)
        const [meterReading2] = await createTestMeterReading(client, meter, source)

        expect(meterReading1.deletedAt).toBeNull()
        expect(meterReading2.deletedAt).toBeNull()

        await updateTestMeter(client, meter1.id, {
            deletedAt: new Date(),
        })

        expect(meterReading1.deletedAt).toBeNull()
        expect(meterReading2.deletedAt).toBeNull()
    })
})