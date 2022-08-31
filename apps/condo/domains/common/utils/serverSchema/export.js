const falsey = require('falsey')
const pino = require('pino')
const { get } = require('lodash')
const { EXPORT_PROCESSING_BATCH_SIZE } = require('../../constants/export')
const { COMPLETED } = require('@condo/domains/common/constants/export')
const { GQLErrorCode: { BAD_USER_INPUT } } = require('@condo/keystone/errors')
const { NOTHING_TO_EXPORT } = require('@condo/domains/common/constants/errors')
const { TASK_PROCESSING_STATUS } = require('@condo/domains/common/constants/tasks')
const Upload = require('graphql-upload/public/Upload')
const { sleep } = require('@condo/domains/common/utils/sleep')
const conf = require('@condo/config')
const { getTmpFile } = require('@condo/domains/common/utils/testSchema/file')
const fs = require('fs')

const TASK_PROGRESS_UPDATE_INTERVAL = 10 * 1000 // 10sec

const logger = pino({ name: 'export', enabled: falsey(process.env.DISABLE_LOGGING) })

const errors = {
    NOTHING_TO_EXPORT: {
        code: BAD_USER_INPUT,
        type: NOTHING_TO_EXPORT,
        message: 'No records to export for {schema} with id "{id}"',
        messageForUser: 'tasks.export.error.NOTHING_TO_EXPORT',
    },
}

// Rough solution to offload server in case of exporting many thousands of records
const SLEEP_TIMEOUT = conf.WORKER_BATCH_OPERATIONS_SLEEP_TIMEOUT || 200

/**
 * Common fields of export task record
 *
 * @typedef ExportTask
 * @property {Number} id
 * @property {Number} exportedRecordsCount
 * @property {Number} totalRecordsCount
 */

/**
 * Converts record fetched from database to file row JSON representation
 * @typedef ConvertRecordToFileRowFunction
 */

/**
 * Loads records batch with specified offset and limit
 * @typedef LoadRecordsBatchFunction
 */
const processRecords = async ({ context, loadRecordsBatch, processRecordsBatch, taskServerUtils, taskId, totalRecordsCount, baseAttrs }) => {
    let offset = 0
    let task // a fresh record we are working with
    const taskSchemaName = taskServerUtils.gql.SINGULAR_FORM
    let lastProgress = Date.now()

    do {
        // User can cancel the task at any time, in this all operations should be stopped
        task = await taskServerUtils.getOne(context, { id: taskId })
        const taskStatus = get(task, 'status')
        if (!task || taskStatus !== TASK_PROCESSING_STATUS) {
            logger.info({ msg: 'status != processing', taskStatus, taskSchemaName, taskId })
            return
        }

        const batch = await loadRecordsBatch(offset, EXPORT_PROCESSING_BATCH_SIZE)
        if (batch.length === 0) {
            // NOTE(pahaz): someone delete some records during the export
            logger.info({ msg: 'empty batch', offset, batchLength: batch.length, taskSchemaName, taskId })
            task = await taskServerUtils.update(context, taskId, {
                ...baseAttrs,
                totalRecordsCount: offset,
                exportedRecordsCount: offset,
            })
            return
        }

        await processRecordsBatch(batch)

        offset += batch.length

        if (Date.now() - lastProgress > TASK_PROGRESS_UPDATE_INTERVAL || offset >= totalRecordsCount) {
            lastProgress = Date.now()
            task = await taskServerUtils.update(context, taskId, {
                ...baseAttrs,
                totalRecordsCount,
                exportedRecordsCount: offset,
            })
        }

        await sleep(SLEEP_TIMEOUT)
    } while (offset < totalRecordsCount)
}
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
const loadRecordsAndConvertToFileRows = async ({ context, loadRecordsBatch, convertRecordToFileRow, taskServerUtils, taskId, totalRecordsCount, baseAttrs }) => {
    let rows = []
    await processRecords({
        context,
        loadRecordsBatch,
        processRecordsBatch: async (batch) => {
            console.log(batch)
            const convertedRecords = await Promise.all(batch.map(convertRecordToFileRow))
            rows.push(...convertedRecords)
        },
        taskServerUtils, taskId, totalRecordsCount, baseAttrs,
    })
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

// TODO(antonal): write tests with mocks of `taskServerUtils`. Currently this util is tested for domain-specific usage

const exportRecords = async ({ context, loadRecordsBatch, convertRecordToFileRow, buildExportFile, baseAttrs, taskServerUtils, totalRecordsCount, taskId }) => {
    let rows = []

    await processRecords({
        context,
        loadRecordsBatch,
        processRecordsBatch: async (batch) => {
            const convertedRecords = await Promise.all(batch.map(convertRecordToFileRow))
            rows.push(...convertedRecords)
        },
        taskServerUtils, taskId, totalRecordsCount, baseAttrs,
    })

    const file = buildUploadInputFrom(await buildExportFile(rows))

    await taskServerUtils.update(context, taskId, {
        ...baseAttrs,
        status: COMPLETED,
        file,
    })
}

const exportRecordsAsCsvFile = async ({ context, loadRecordsBatch, convertRecordToFileRow, baseAttrs, taskServerUtils, totalRecordsCount, taskId }) => {
    const filename = getTmpFile('csv')
    const writeStream = fs.createWriteStream(filename, { encoding: 'utf8' })
    let isFirstLine = true
    const listkey = taskServerUtils.gql.SINGULAR_FORM

    await processRecords({
        context, loadRecordsBatch,
        processRecordsBatch: async (batch) => {
            const convertedRecords = await Promise.all(batch.map(convertRecordToFileRow))
            if (isFirstLine) {
                // NOTE(pahaz): need to write headers
                writeStream.write(Object.keys(convertedRecords[0]).join(',') + '\n')
                isFirstLine = false
            }
            writeStream.write(convertedRecords.map(row => Object.values(row).map(JSON.stringify).join(',')).join('\n') + '\n')
        },
        baseAttrs, taskServerUtils, totalRecordsCount, taskId,
    })

    writeStream.close()

    const stream = fs.createReadStream(filename, { encoding: 'utf8' })
    const file = buildUploadInputFrom({
        stream, filename: 'export.csv', mimetype: 'text/csv', encoding: 'utf8',
        meta: { listkey, id: taskId },
    })

    return await taskServerUtils.update(context, taskId, {
        ...baseAttrs,
        status: COMPLETED,
        file,
    })
}

module.exports = {
    loadRecordsAndConvertToFileRows,
    exportRecords,
    exportRecordsAsCsvFile,
}