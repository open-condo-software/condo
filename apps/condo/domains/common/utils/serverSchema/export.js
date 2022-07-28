const { EXPORT_PROCESSING_BATCH_SIZE } = require('../../constants/export')
const { COMPLETED } = require('@condo/domains/common/constants/export')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { NOTHING_TO_EXPORT } = require('@condo/domains/common/constants/errors')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const Upload = require('graphql-upload/public/Upload')

const errors = {
    NOTHING_TO_EXPORT: {
        query: 'exportTicketsToExcel',
        variable: ['data', 'property'],
        code: BAD_USER_INPUT,
        type: NOTHING_TO_EXPORT,
        message: 'No tickets found to export',
        messageForUser: 'api.ticket.exportTicketsToExcel.NOTHING_TO_EXPORT',
    },
}

/**
 * Common fields of export task record
 *
 * @typedef ExportTask
 * @property {Number} id
 * @property {Number} exportedRecordsCount
 */

/**
 * Converts record fetched from database to file row JSON representation
 * @typedef ConvertRecordToFileRowFunction
 */

/**
 * Loads records batch with specified offset and limit
 * @typedef LoadRecordsBatchFunction
 */

/**
 * Queries records in batches to avoid database overload, converts them to file rows representation
 * @param {Object} args
 * @param args.context - Keystone context
 * @param {LoadRecordsBatchFunction} args.loadRecordsBatch - function to load a batch of records
 * @param {ConvertRecordToFileRowFunction} args.convertRecordToFileRow - function to convert record to file row JSON representation
 * @param {ExportTask} args.task - task schema record that needs to be updated during operation progress
 * @param args.taskServerUtils - utils from serverSchema
 * @return {Promise<*[]>} - JSON representation of file rows, that will be saved to file
 */
const loadRecordsAndConvertToFileRows = async ({ context, loadRecordsBatch, convertRecordToFileRow, task, taskServerUtils }) => {
    let hasMore
    let offset = 0
    let rows = []

    do {
        const batch = await loadRecordsBatch(offset, EXPORT_PROCESSING_BATCH_SIZE)
        if (batch.length === 0) {
            if (offset === 0) {
                throw new GQLError(errors.NOTHING_TO_EXPORT, context)
            }
        } else {
            const convertedRecords = await Promise.all(batch.map(convertRecordToFileRow))
            rows = [
                ...rows,
                ...convertedRecords,
            ]

            await taskServerUtils.update(context, task.id, {
                dv: 1,
                sender: {
                    dv: 1,
                    fingerprint: TASK_WORKER_FINGERPRINT,
                },
                exportedRecordsCount: task.exportedRecordsCount + batch.length,
            })
        }

        hasMore = batch.length > 0
        offset += EXPORT_PROCESSING_BATCH_SIZE
    } while (hasMore)

    return rows
}

const buildUploadInputFrom = ({ stream, filename, mimetype, encoding, meta }) => {
    const uploadData = {
        createReadStream: () => {
            return stream
        },
        filename,
        mimetype,
        encoding,
        meta,
    }
    const uploadInput = new Upload()
    uploadInput.promise = new Promise(resolve => {
        resolve(uploadData)
    })
    return uploadInput
}

const exportRecords = async ({ context, loadRecordsBatch, convertRecordToFileRow, buildExportFile, task, taskServerUtils }) => (
    loadRecordsAndConvertToFileRows({
        context,
        loadRecordsBatch,
        convertRecordToFileRow,
        task,
        taskServerUtils,
    })
        .then(buildExportFile)
        .then(async ({ stream, filename, mimetype, encoding, meta }) => {
            const file = buildUploadInputFrom({ stream, filename, mimetype, encoding, meta })
            const data = {
                dv: 1,
                sender: task.sender,
                status: COMPLETED,
                file,
            }
            const updatedTask = await taskServerUtils.update(context, task.id, data)
            return updatedTask
        })
)

module.exports = {
    loadRecordsAndConvertToFileRows,
    exportRecords,
}