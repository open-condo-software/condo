const { EXPORT_PROCESSING_BATCH_SIZE } = require('../../constants/export')
const { COMPLETED, PROCESSING } = require('@condo/domains/common/constants/export')

/**
 * Queries records in batches and converts them to rows, that will be saved to file
 * @param loadRecords
 * @param convertRecord
 * @param task
 * @param taskSchema
 * @return {Promise<*[]>}
 */
const loadRecordsAndConvertToFileRows = async ({ loadRecords, convertRecord, task, taskServerUtils }) => {
    let hasMore
    let offset = 0
    let rows = []

    do {
        const batch = await loadRecords(offset, EXPORT_PROCESSING_BATCH_SIZE)
        if (batch.length > 0) {
            rows = [
                ...rows,
                ...batch.map(convertRecord),
            ]
        }

        taskServerUtils.update(task.id, {
            exportedRecordsCount: task.exportedRecordsCount + batch.length,
        })

        hasMore = batch.length > 0
        offset += EXPORT_PROCESSING_BATCH_SIZE
    } while (hasMore)

    return rows
}

const exportJob = ({ loadRecords, format, taskServerUtils, task, convertRecord, saveToFile }) => {
    loadRecordsAndConvertToFileRows({ loadRecords, convertRecord, task, taskServerUtils })
        .then(rows => {
            saveToFile({ format, rows })
        })
        .then(url => {
            taskServerUtils.update(task.id, {
                status: COMPLETED,
                file: url,
            })
        })
}

/**
 * Creates an export task, starts delayed export job and returns task
 *
 * @param {EXPORT_FORMAT_VALUES} format - file format
 * @param loadRecords - function to load records batch
 * @param convertRecord - function to convert batch to file row representation
 * @param taskServerUtils - task server utils
 * @return {Promise<*>}
 */
async function startExportJob ({ format, loadRecords, convertRecord, saveToFile, taskServerUtils }) {
    const task = taskServerUtils.create({
        status: PROCESSING,
        format,
    })

    await exportJob.delay({
        format,
        loadRecords,
        convertRecord,
        saveToFile,
        task,
        taskServerUtils,
    })

    return task
}

module.exports = {
    startExportJob,
}