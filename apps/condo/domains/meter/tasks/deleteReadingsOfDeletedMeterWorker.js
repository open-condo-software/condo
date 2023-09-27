const { getSchemaCtx, find } = require('@open-condo/keystone/schema')

const { MeterReading } = require('@condo/domains/meter/utils/serverSchema')
const { PropertyMeterReading } = require('@condo/domains/meter/utils/serverSchema')

/**
 * Soft delete meter readings after soft delete meter
 */
async function deleteReadingsOfDeletedMeterWorker (deletedMeter, deletedMeterAt) {
    const { keystone: context } = await getSchemaCtx('Property')

    const isPropertyMeter = deletedMeter.__typename === 'PropertyMeter'
    const meterId = deletedMeter.id
    const meterReadings = await find(isPropertyMeter ? 'PropertyMeterReading' : 'MeterReading', {
        meter: { id: meterId },
        deletedAt: null,
    })

    const readingModel = isPropertyMeter ? PropertyMeterReading : MeterReading

    for (const reading of meterReadings) {
        await readingModel.update(context, reading.id, {
            deletedAt: deletedMeterAt,
            dv: deletedMeter.dv,
            sender: deletedMeter.sender,
        })
    }
}

module.exports = {
    deleteReadingsOfDeletedMeterWorker,
}
