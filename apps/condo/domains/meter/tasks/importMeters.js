const { createReadStream } = require('fs')
const { Readable } = require('stream')

const { faker } = require('@faker-js/faker')
const Upload = require('graphql-upload/Upload.js')
const { get, isNil, isEmpty } = require('lodash')
const fetch = require('node-fetch')

const { SBERCLOUD_OBS_CONFIG } = require('@open-condo/config')
const { ConvertFileToTable, getObjectStream } = require('@open-condo/keystone/file')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { 
    IMPORT_FORMAT_VALUES,
    IMPORT_STATUS_VALUES,
    EXCEL,
    CSV,
    PROCESSING,
    ERROR,
    CANCELLED,
    COMPLETED,
    METER_IMPORT_TASK_FOLDER_NAME,
} = require('@condo/domains/common/constants/import')
const { EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { SberCloudFileAdapter } = require('@condo/domains/common/utils/sberCloudFileAdapter')
const { MeterImportTask } = require('@condo/domains/meter/utils/serverSchema')
const { getImporter } = require('@condo/domains/meter/utils/taskSchema')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'import-meter-job' } }
const fileAdapter = new FileAdapter(METER_IMPORT_TASK_FOLDER_NAME)

function createUpload (content, filename, mimetype) {
    // handle file upload
    // firstly create a stream from Buffer
    const stream = Readable.from(content)

    // next: create the wrapper for file object create input
    const upload = new Upload()
    upload.resolve({
        // Normally this would be a createReadStream function pointed to a file,
        // but our function creates a Readable object pointed at our in-memory buffer instead
        createReadStream: () => stream,
        // These three properties can be customised, but must exist for validation
        filename,
        mimetype,
        encoding: 'utf-8',
    })

    return upload
}

async function failWithErrorFail (context, taskId, content, format) {
    const filename = format === EXCEL ? 'meters_failed_data.xlsx' : 'meters_failed_data.csv'
    const mimetype = format === EXCEL ? EXCEL_FILE_META.mimetype : 'text/csv' 

    await MeterImportTask.update(context, taskId, {
        ...dvAndSender,
        status: ERROR,
        errorFile: await createUpload(content, filename, mimetype),
    })
}

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

    // get task definition
    const { file, user, organization } = await MeterImportTask.getOne(context, { id: taskId })

    // download file
    const content = await getObjectStream(file, fileAdapter, false)
    if (isEmpty(content)) {
        return
    }

    // create file converter
    const converter = new ConvertFileToTable(content)

    // detect && fill format
    const format = await converter.isExcelFile() ? EXCEL : CSV
    await MeterImportTask.update(context, taskId, {
        ...dvAndSender,
        format,
    })

    // read table && fill total
    const data = await converter.getData()
    
    // create importer
    const importer = await getImporter(context, taskId, organization.id, user.id, format)
    
    // do import
    await importer.import(data)
    
    // get failed rows
    const { status: currentStatus } = await MeterImportTask.getOne(context, { id: taskId })
    const { failedRows } = importer
    
    // postprocessing results:
    // - currentStatus === error - nothing to do
    // - currentStatus === cancelled - nothing to do
    // - currentStatus === processing and no failedRows - completed
    // - currentStatus === processing and has failedRows - error + generate error file
    if (currentStatus === ERROR || currentStatus === CANCELLED) {
        return
    } else if (currentStatus === PROCESSING && failedRows.length === 0) {
        await MeterImportTask.update(context, taskId, {
            ...dvAndSender,
            status: COMPLETED,
        })
    } else if (currentStatus === PROCESSING && failedRows.length > 0) {
        const errorFileContent = await importer.generateErrorFile()
        await failWithErrorFail(context, taskId, errorFileContent, format)
    }
}

module.exports = {
    importMeters,
    createUpload,
}
