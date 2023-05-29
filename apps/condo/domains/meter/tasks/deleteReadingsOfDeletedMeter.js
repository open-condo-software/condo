const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { MeterReading } = require('@condo/domains/meter/utils/serverSchema')
const { CommunalMeterReading } = require('@condo/domains/meter/utils/serverSchema')

/**
 * Soft delete meter readings after soft delete meter
 */
async function deleteReadingsOfDeletedMeter (deletedMeter, deletedMeterAt, isCommunalMeter = false) {
    const { keystone: context } = await getSchemaCtx('Property')

    const meterId = deletedMeter.id
    const meterReadings = await find(isCommunalMeter ? 'CommunalMeterReading' : 'MeterReading', {
        meter: { id: meterId },
        deletedAt: null,
    })

    if (isCommunalMeter) {
        for (const reading of meterReadings) {
            await CommunalMeterReading.update(context, reading.id, {
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
