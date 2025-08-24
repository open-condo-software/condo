const dayjs = require('dayjs')
const get = require('lodash/get')
const uniq = require('lodash/uniq')
const uniqBy = require('lodash/uniqBy')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { i18n } = require('@open-condo/locales/loader')

const { ERROR, EXCEL } = require('@condo/domains/common/constants/export')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { EXCEL_FILE_META, buildExportFile: buildExportExcelFile } = require('@condo/domains/common/utils/createExportFile')
const { getHeadersTranslations } = require('@condo/domains/common/utils/exportToExcel')
const { EXPORT_TYPE_METERS } = require('@condo/domains/common/utils/exportToExcel')
const { exportRecordsAsXlsxFile } = require('@condo/domains/common/utils/serverSchema/export')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { MeterReadingExportTask, MeterReading, loadMetersForExcelExport } = require('@condo/domains/meter/utils/serverSchema')
const { loadMeterReadingsForExcelExport, MeterResource, MeterReadingSource } = require('@condo/domains/meter/utils/serverSchema')


const BASE_ATTRIBUTES = { dv: 1, sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT } }
const DATE_FORMAT = 'DD.MM.YYYY'

const taskLogger = getLogger()

const formatDate = (date, timeZone, format = DATE_FORMAT) => {
    return dayjs(date).tz(timeZone).format(format)
}

const meterReadingToRow = async ({ task, meterReading }) => {
    const { timeZone, locale } = task

    const unitType = meterReading.unitType ? i18n(`pages.condo.ticket.field.unitType.${meterReading.unitType}`, { locale }) : ''
    const status = i18n(`pages.condo.meter.Meter.${meterReading.status ? 'outOfOrder' : 'isActive'}`, { locale })
    const nextVerificationDate = meterReading.nextVerificationDate ? formatDate(meterReading.nextVerificationDate, timeZone) : ''
    return {
        date: formatDate(meterReading.date, timeZone),
        address: meterReading.address,
        unitName: meterReading.unitName,
        unitType,
        accountNumber: meterReading.accountNumber,
        resource: meterReading.resource,
        number: meterReading.number,
        place: meterReading.place,
        value1: meterReading.value1,
        value2: meterReading.value2,
        value3: meterReading.value3,
        value4: meterReading.value4,
        clientName: meterReading.clientName,
        source: meterReading.source,
        nextVerificationDate,
        status,
    }
}

const buildExportFile = async ({ task, rows }) => {
    const { id, locale, where, timeZone } = task

    const dateGte = where.date_gte
    const dateLte = where.date_lte

    const headerMessage = dateGte && dateLte
        ? `${i18n('excelExport.headers.meters.forPeriod.title', { locale })} ${formatDate(dateGte, timeZone)} — ${formatDate(dateLte, timeZone)}`
        : i18n('excelExport.headers.meters.title', { locale })

    const { stream } = await buildExportExcelFile({
        templatePath: './domains/meter/templates/MeterReadingsExportTemplate.xlsx',
        replaces: {
            header: headerMessage,
            meter: rows,
            i18n: {
                ...getHeadersTranslations(EXPORT_TYPE_METERS, locale),
                sheetName: i18n('global.section.meters', { locale }),
            },
        },
    })

    return {
        stream,
        filename: `meterReadings_${dayjs().format('DD_MM')}.xlsx`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'MeterReadingExportTask',
            id,
        },
    }
}

async function exportMeterReadings (taskId) {
    if (!taskId) {
        taskLogger.error({
            msg: 'taskId is undefined',
        })
        throw new Error('taskId is undefined')
    }

    const { keystone: context } = getSchemaCtx('MeterReadingExportTask')

    const task = await MeterReadingExportTask.getOne(context, { id: taskId }, 'id timeZone format where sortBy locale')
    if (!task) {
        taskLogger.error({
            msg: 'No task with specified id',
            entityId: taskId,
            entity: 'MeterReadingExportTask',
        })
        throw new Error(`No task with id "${taskId}"`)
    }

    const { where, sortBy, format, locale } = task

    try {
        if (!locale) {
            throw new Error(`MeterReadingExportTask with id "${taskId}" does not have value for "locale" field!`)
        }

        setLocaleForKeystoneContext(context, locale)

        const totalRecordsCount = await MeterReading.count(context, where)

        const meterReadings = await loadMeterReadingsForExcelExport({ where, sortBy })
        const lastReadingsByMeter = uniqBy(meterReadings.sort((a, b) => (a.date < b.date ? 1 : -1)), (reading => get(reading, 'meter')))

        const meterResources = await MeterResource.getAll(context, {}, 'id name')
        const meterReadingSources = await MeterReadingSource.getAll(context, {}, 'id name')
        const meterIds = uniq(lastReadingsByMeter.map(meterReading => meterReading.meter))
        const meters = await loadMetersForExcelExport({ where: { id_in: meterIds } })

        const mappedMeterReadings = lastReadingsByMeter.map(meterReading => {
            const source = meterReadingSources.find(meterReadingSource => meterReadingSource.id === meterReading.source)
            const sourceName = get(source, 'name')
            const meter = meters.find(meter => meter.id === meterReading.meter)
            if (!meter) return

            const resource = meterResources.find(meterResource => meterResource.id === meter.resource)
            const resourceName = get(resource, 'name')

            meterReading.source = sourceName
            meterReading.resource = resourceName
            meterReading.unitName = meter.unitName
            meterReading.unitType = meter.unitType
            meterReading.number = meter.number
            meterReading.place = meter.place
            meterReading.address = meter.property
            meterReading.nextVerificationDate = meter.nextVerificationDate
            meterReading.status = meter.archiveDate

            return meterReading
        }).filter(Boolean)

        const loadRecordsBatch = async (offset, limit) => {
            this.progress(Math.floor(offset / totalRecordsCount * 100))
            return mappedMeterReadings.slice(offset, offset + limit)
        }
        const convertRecordToFileRow = async (meterReading) => await meterReadingToRow({
            task,
            meterReading,
        })

        switch (format) {
            case EXCEL: {
                await exportRecordsAsXlsxFile({
                    context,
                    loadRecordsBatch,
                    convertRecordToFileRow,
                    buildExportFile: (rows) => buildExportFile({ rows, task }),
                    baseAttrs: BASE_ATTRIBUTES,
                    taskServerUtils: MeterReadingExportTask,
                    totalRecordsCount,
                    taskId,
                })
            }
        }
    } catch (err) {
        await MeterReadingExportTask.update(context, taskId, {
            ...BASE_ATTRIBUTES,
            status: ERROR,
        })

        taskLogger.error({
            msg: 'Failed to export meter readings',
            entityId: taskId,
            entity: 'MeterReadingExportTask',
            err,
        })

        throw err
    }
}

module.exports = {
    exportMeterReadings: createTask('exportMeterReadings', exportMeterReadings, 'low'),
}
