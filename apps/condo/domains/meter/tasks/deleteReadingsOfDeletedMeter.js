const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { MeterReading } = require('@condo/domains/meter/utils/serverSchema')
const { PropertyMeterReading } = require('@condo/domains/meter/utils/serverSchema')

/**
 * Soft delete meter readings after soft delete meter
 */
async function deleteReadingsOfDeletedMeter (deletedMeter, deletedMeterAt, isPropertyMeter = false) {
    const { keystone: context } = await getSchemaCtx('Property')

    const meterId = deletedMeter.id
    const meterReadings = await find(isPropertyMeter ? 'PropertyMeterReading' : 'MeterReading', {
        meter: { id: meterId },
        deletedAt: null,
    })

    if (isPropertyMeter) {
        for (const reading of meterReadings) {
            await PropertyMeterReading.update(context, reading.id, {
                deletedAt: deletedMeterAt,
                dv: deletedMeter.dv,
                sender: deletedMeter.sender,
            })
        }
    } else {
        for (const reading of meterReadings) {
            await MeterReading.update(context, reading.id, {
                deletedAt: deletedMeterAt,
                dv: deletedMeter.dv,
                sender: deletedMeter.sender,
            })
        }
    }
}

module.exports = createTask('deleteReadingsOfDeletedMeter', deleteReadingsOfDeletedMeter)
