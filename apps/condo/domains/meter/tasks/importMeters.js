const { Readable } = require('stream')

const Upload = require('graphql-upload/Upload.js')
const { get, isEmpty } = require('lodash')

const { ConvertFileToTable, getObjectStream, readFileFromStream } = require('@open-condo/keystone/file')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    DOMA_EXCEL,
    CSV,
    PROCESSING,
    ERROR,
    CANCELLED,
    COMPLETED,
    METER_READINGS_IMPORT_TASK_FOLDER_NAME,
} = require('@condo/domains/common/constants/import')
const { EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { MeterReadingsImportTask } = require('@condo/domains/meter/utils/serverSchema')
const { getImporter } = require('@condo/domains/meter/utils/taskSchema')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'import-meter-job' } }
const fileAdapter = new FileAdapter(METER_READINGS_IMPORT_TASK_FOLDER_NAME)

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

async function failWithErrorFile (context, taskId, content, format) {
    const filename = format === DOMA_EXCEL ? 'meters_failed_data.xlsx' : 'meters_failed_data.csv'
    const mimetype = format === DOMA_EXCEL ? EXCEL_FILE_META.mimetype : 'text/csv'

    // update status and save error file
    const updated = await MeterReadingsImportTask.update(context, taskId, {
        ...dvAndSender,
        status: ERROR,
        errorFile: await createUpload(content, filename, mimetype),
    }, 'errorFile { filename }')

    // update file meta in order to make file accessible for user download request
    if (fileAdapter.acl && fileAdapter.acl.setMeta) {
        const filename = get(updated, 'errorFile.filename')

        await fileAdapter.acl.setMeta(
            `${METER_READINGS_IMPORT_TASK_FOLDER_NAME}/${filename}`,
            { listkey: 'MeterReadingsImportTask', id: taskId },
        )
    }
}

/**
 * Processor for import meters job
 *
 * NOTE: Task progress should be reported to Bull via `Job` interface, which is assigned to `this` variable.
 * If this operation takes more than a timeout in Bull (30 seconds), a 'stalled' event
 * will be emitted and the job will be translated to 'failed' state
 *
 * @param taskId - id of `MeterReadingsImportTask` record, obtained from job `data` arguments
 * @returns {Promise<void>}
 */
async function importMeters (taskId) {
    if (!taskId) throw new Error('taskId is undefined')
    const { keystone: context } = getSchemaCtx('MeterReadingsImportTask')

    // get task definition
    const { file, user, organization, locale, isPropertyMeters } = await MeterReadingsImportTask.getOne(
        context,
        { id: taskId },
        'file { id originalFilename filename publicUrl mimetype } user { id } organization { id } locale isPropertyMeters'
    )

    // since we would like to catch all errors and immediately tell to user about them
    // let's wrap whole proceeding code body into try catch
    try {
        if (!locale) throw new Error(`MeterReadingsImportTask with id "${taskId}" does not have value for "locale" field!`)

        setLocaleForKeystoneContext(context, locale)

        // download file
        const contentStream = await getObjectStream(file, fileAdapter)
        if (isEmpty(contentStream)) {
            return
        }

        // read stream
        const content = await readFileFromStream(contentStream)

        // create file converter
        const converter = new ConvertFileToTable(content)

        // For now we support only two formats: doma-excel and 1S (txt/csv)
        const isExcelFile = await converter.isExcelFile()
        const format = isExcelFile ? DOMA_EXCEL : CSV
        await MeterReadingsImportTask.update(context, taskId, {
            ...dvAndSender,
            format,
        })

        // read table && fill total
        const data = await converter.getData()

        // create importer
        const importer = await getImporter(context, taskId, organization.id, user.id, format, locale, isPropertyMeters)

        // do import
        await importer.import(data)

        // get failed rows
        const {
            status: currentStatus,
        } = await MeterReadingsImportTask.getOne(context, { id: taskId }, 'status')
        const { failedRows } = importer

        // postprocessing results:
        // - currentStatus === error - nothing to do
        // - currentStatus === cancelled - nothing to do
        // - currentStatus === processing and no failedRows - completed
        // - currentStatus === processing and has failedRows - error + generate error file
        if (currentStatus === ERROR || currentStatus === CANCELLED) {
            return
        } else if (currentStatus === PROCESSING && failedRows.length === 0) {
            await MeterReadingsImportTask.update(context, taskId, {
                ...dvAndSender,
                status: COMPLETED,
            }, 'id')
        } else {
            const errorFileContent = await importer.generateErrorFile()
            await failWithErrorFile(context, taskId, errorFileContent, format)
        }
    } catch (err) {
        const errorMessage = get(err, 'errors[0].extensions.messageForUser', get(err, 'message'))
            || 'not recognized error'

        await MeterReadingsImportTask.update(context, taskId, {
            ...dvAndSender,
            status: ERROR,
            errorMessage,
        })
    }
}

module.exports = {
    importMeters,
    createUpload,
}
