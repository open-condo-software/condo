const { Readable } = require('stream')

const dayjs = require('dayjs')
const isArray = require('lodash/isArray')
const uniq = require('lodash/uniq')
const XLSX = require('xlsx')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { BillingReceiptEmailTask, BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')
const { ERROR, EXCEL } = require('@condo/domains/common/constants/export')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')
const { exportRecordsAsXlsxFile } = require('@condo/domains/common/utils/serverSchema/export')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')

const BASE_ATTRIBUTES = { dv: 1, sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT } }
const DATE_FORMAT = 'DD.MM.YYYY'
const EMPTY_VALUE = '—'

const taskLogger = getLogger()

const formatDate = (date, timeZone, format = DATE_FORMAT) => dayjs(date).tz(timeZone).format(format)

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

const billingReceiptToRow = ({ billingReceipt, task }) => {
    const { timeZone } = task

    return {
        receiptId: billingReceipt.id,
        period: billingReceipt.period ? formatDate(billingReceipt.period, timeZone) : EMPTY_VALUE,
        propertyAddress: billingReceipt.propertyAddress || EMPTY_VALUE,
        accountNumber: billingReceipt.accountNumber || EMPTY_VALUE,
        unitName: billingReceipt.unitName || EMPTY_VALUE,
        fullName: billingReceipt.fullName || EMPTY_VALUE,
        toPay: billingReceipt.toPay || EMPTY_VALUE,
        hasPdf: billingReceipt.fileId ? 'yes' : 'no',
        result: 'prepared',
    }
}

const buildExportFile = async ({ rows, task }) => {
    const { id, period } = task

    const periodLabel = period ? formatDate(period, task.timeZone) : EMPTY_VALUE

    const workbook = XLSX.utils.book_new()
    const sheetData = rows.length > 0 ? rows : [{ receiptId: EMPTY_VALUE, result: EMPTY_VALUE }]
    const worksheet = XLSX.utils.json_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts')

    // Keep period in workbook custom props so it is visible in metadata and traceable in downloaded report
    workbook.Props = {
        Title: `Billing receipts email report (${periodLabel})`,
        CreatedDate: new Date(),
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
    const stream = Readable.from(buffer)

    return {
        stream,
        filename: `billing_receipts_email_report_${dayjs().format('DD_MM_YYYY')}.xlsx`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'BillingReceiptEmailTask',
            id,
        },
    }
}

async function sendBillingReceiptPdfsByEmail (taskId) {
    if (!taskId) {
        taskLogger.error({ msg: 'taskId is undefined' })
        throw new Error('taskId is undefined')
    }

    const { keystone: context } = getSchemaCtx('BillingReceiptEmailTask')
    const task = await BillingReceiptEmailTask.getOne(context, { id: taskId }, 'id timeZone format where period sortBy locale receiptIds')

    if (!task) {
        taskLogger.error({
            msg: 'No task with specified id',
            entityId: taskId,
            entity: 'BillingReceiptEmailTask',
        })
        throw new Error(`No task with id "${taskId}"`)
    }

    const { where, sortBy, format, locale, receiptIds, period } = task

    try {
        if (!locale) {
            throw new Error(`BillingReceiptEmailTask with id "${taskId}" does not have value for "locale" field!`)
        }

        setLocaleForKeystoneContext(context, locale)

        const uniqueReceiptIds = isArray(receiptIds) ? uniq(receiptIds.filter(Boolean)) : []

        const receiptsWhere = {
            ...(where || {}),
            period,
            ...(uniqueReceiptIds.length > 0 ? { id_in: uniqueReceiptIds } : {}),
        }

        const totalRecordsCount = await BillingReceipt.count(context, receiptsWhere)
        const receiptsLoader = buildBillingReceiptsLoader({
            where: receiptsWhere,
            sortBy: sortBy || ['period_DESC', 'createdAt_DESC'],
        })

        const loadRecordsBatch = async (offset, limit) => {
            const receipts = await receiptsLoader.loadChunk(offset, limit)
            if (totalRecordsCount > 0) {
                this.progress(Math.floor(offset / totalRecordsCount * 100))
            }
            return receipts
        }

        const convertRecordToFileRow = async (billingReceipt) => billingReceiptToRow({ billingReceipt, task })

        switch (format) {
            case EXCEL: {
                await exportRecordsAsXlsxFile({
                    context,
                    loadRecordsBatch,
                    convertRecordToFileRow,
                    buildExportFile: (rows) => buildExportFile({ rows, task }),
                    baseAttrs: BASE_ATTRIBUTES,
                    taskServerUtils: BillingReceiptEmailTask,
                    totalRecordsCount,
                    taskId,
                })
                break
            }
        }
    } catch (err) {
        await BillingReceiptEmailTask.update(context, taskId, {
            ...BASE_ATTRIBUTES,
            status: ERROR,
        })

        taskLogger.error({
            msg: 'Failed to process billing receipts email task',
            entityId: taskId,
            entity: 'BillingReceiptEmailTask',
            err,
        })

        throw err
    }
}

module.exports = {
    sendBillingReceiptPdfsByEmail: createTask('sendBillingReceiptPdfsByEmail', sendBillingReceiptPdfsByEmail, 'low'),
}
