const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { MeterImportTask } = require('@condo/domains/meter/utils/serverSchema')

/**
 * Processor for import meters job
 *
 * NOTE: Task progress should be reported to Bull via `Job` interface, which is assigned to `this` variable.
 * If this operation takes more than a timeout in Bull (30 seconds), a 'stalled' event
 * will be emitted and the job will be translated to 'failed' state
 *
 * @param taskId - id of `MeterImportTask` record, obtained from job `data` arguments
 * @returns {Promise<void>}
 */
async function importMeters (taskId) {
    if (!taskId) throw new Error('taskId is undefined')
    const { keystone: context } = await getSchemaCtx('MeterImportTask')

    const task = await MeterImportTask.getOne(context, { id: taskId })
}

module.exports = {
    importMeters,
}
