const { Readable } = require('stream')

const dayjs = require('dayjs')
const XLSX = require('xlsx')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { BillingSendBillingReceiptFilesTask } = require('@condo/domains/billing/utils/serverSchema')
const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')
const { ERROR } = require('@condo/domains/common/constants/export')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')
const { exportRecordsAsXlsxFile } = require('@condo/domains/common/utils/serverSchema/export')

const BASE_ATTRIBUTES = { dv: 1, sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT } }
const EMPTY_VALUE = '—'

const taskLogger = getLogger()

const buildBillingReceiptsLoader = ({ where, sortBy }) => {
    return new GqlWithKnexLoadList({
        listKey: 'BillingReceipt',
        fields: 'id period toPay',
        singleRelations: [
            ['BillingProperty', 'property', 'address', 'propertyAddress'],
            ['BillingAccount', 'account', 'number', 'accountNumber'],
            ['BillingAccount', 'account', 'unitName', 'unitName'],
            ['BillingAccount', 'account', 'fullName', 'fullName'],
            ['BillingReceiptFile', 'file', 'id', 'fileId'],
        ],
        sortBy,
        where,
    })
}

const billingReceiptToRow = (billingReceipt) => {
    return {
        receiptId: billingReceipt.id,
        period: billingReceipt.period || EMPTY_VALUE,
        propertyAddress: billingReceipt.propertyAddress || EMPTY_VALUE,
        accountNumber: billingReceipt.accountNumber || EMPTY_VALUE,
        unitName: billingReceipt.unitName || EMPTY_VALUE,
        fullName: billingReceipt.fullName || EMPTY_VALUE,
        toPay: billingReceipt.toPay || EMPTY_VALUE,
        hasBillingReceiptFile: billingReceipt.fileId ? 'yes' : 'no',
        result: 'prepared',
    }
}

const buildExportFile = async ({ rows, task }) => {
    const { id, period } = task

    const workbook = XLSX.utils.book_new()
    const sheetData = rows.length > 0 ? rows : [{ receiptId: EMPTY_VALUE, result: EMPTY_VALUE }]
    const worksheet = XLSX.utils.json_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts')

    workbook.Props = {
        Title: `billing_receipt_files_email_report_${period || EMPTY_VALUE}`,
        CreatedDate: new Date(),
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
    const stream = Readable.from(buffer)

    return {
        stream,
        filename: `billing_receipt_files_email_report_${dayjs().format('DD_MM_YYYY')}.xlsx`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'BillingSendBillingReceiptFilesTask',
            id,
        },
    }
}

async function sendBillingReceiptFilesByEmail (taskId) {
    if (!taskId) {
        taskLogger.error({ msg: 'taskId is undefined' })
        throw new Error('taskId is undefined')
    }

    const { keystone: context } = getSchemaCtx('BillingSendBillingReceiptFilesTask')
    const task = await BillingSendBillingReceiptFilesTask.getOne(context, { id: taskId }, 'id period')

    if (!task) {
        taskLogger.error({
            msg: 'No task with specified id',
            entityId: taskId,
            entity: 'BillingSendBillingReceiptFilesTask',
        })
        throw new Error(`No task with id "${taskId}"`)
    }

    const { period } = task

    try {
        const where = { period }
        const totalRecordsCount = await BillingReceipt.count(context, where)
        const receiptsLoader = buildBillingReceiptsLoader({
            where,
            sortBy: ['period_DESC', 'createdAt_DESC'],
        })

        const loadRecordsBatch = async (offset, limit) => {
            const receipts = await receiptsLoader.loadChunk(offset, limit)
            if (totalRecordsCount > 0) {
                this.progress(Math.floor(offset / totalRecordsCount * 100))
            }
            return receipts
        }

        const convertRecordToFileRow = async (billingReceipt) => billingReceiptToRow(billingReceipt)

        const billingSendTaskServerUtils = {
            ...BillingSendBillingReceiptFilesTask,
        }

        await exportRecordsAsXlsxFile({
            context,
            loadRecordsBatch,
            convertRecordToFileRow,
            buildExportFile: (rows) => buildExportFile({ rows, task }),
            baseAttrs: BASE_ATTRIBUTES,
            taskServerUtils: billingSendTaskServerUtils,
            totalRecordsCount,
            taskId,
        })

        await BillingSendBillingReceiptFilesTask.update(context, taskId, {
            ...BASE_ATTRIBUTES,
        })
    } catch (err) {
        await BillingSendBillingReceiptFilesTask.update(context, taskId, {
            ...BASE_ATTRIBUTES,
            status: ERROR,
        })

        taskLogger.error({
            msg: 'Failed to process billing receipt files email task',
            entityId: taskId,
            entity: 'BillingSendBillingReceiptFilesTask',
            err,
        })

        throw err
    }
}

module.exports = {
    sendBillingReceiptFilesByEmail: createTask('sendBillingReceiptFilesByEmail', sendBillingReceiptFilesByEmail, 'low'),
}
