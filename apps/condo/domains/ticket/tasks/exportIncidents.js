const dayjs = require('dayjs')
const compact = require('lodash/compact')
const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { i18n } = require('@open-condo/locales/loader')

const { ERROR, EXCEL } = require('@condo/domains/common/constants/export')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { EXCEL_FILE_META, buildExportFile: buildExportExcelFile } = require('@condo/domains/common/utils/createExportFile')
const { findAllByKey } = require('@condo/domains/common/utils/ecmascript.utils')
const { getHeadersTranslations, EXPORT_TYPE_INCIDENTS } = require('@condo/domains/common/utils/exportToExcel')
const { exportRecordsAsCsvFile, exportRecordsAsXlsxFile } = require('@condo/domains/common/utils/serverSchema/export')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { INCIDENT_STATUS_ACTUAL, INCIDENT_WORK_TYPE_SCHEDULED, INCIDENT_WORK_TYPE_EMERGENCY } = require('@condo/domains/ticket/constants/incident')
const { IncidentExportTask, Incident, buildIncidentsLoader,
    loadIncidentPropertiesForExcelExport,
    loadIncidentClassifierIncidentsForExcelExport,
    loadIncidentClassifiersForExcelExport,
} = require('@condo/domains/ticket/utils/serverSchema')


const BASE_ATTRIBUTES = { dv: 1, sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT } }
const MAX_XLSX_FILE_ROWS = 10000
const DATE_FORMAT = 'DD.MM.YYYY'
const EMPTY_VALUE = '—'

const taskLogger = getLogger()


const buildTranslations = (locale) => ({
    AllProperties: i18n('incident.fields.properties.allSelected', { locale }),
    Actual: i18n('incident.status.actual', { locale }),
    NotActual: i18n('incident.status.notActual', { locale }),
    PropertyWasDeleted: i18n('incident.fields.properties.wasDeleted', { locale }),
    WorkTypes: {
        [INCIDENT_WORK_TYPE_SCHEDULED]: i18n('incident.workType.scheduled', { locale }),
        [INCIDENT_WORK_TYPE_EMERGENCY]: i18n('incident.workType.emergency', { locale }),
    },
})

const classifiersToString = (classifiers, locale) => {
    if (!classifiers || classifiers.length < 1) {
        return EMPTY_VALUE
    }

    const categories = compact(uniq(classifiers
        .map(({ category }) => i18n(category, { locale }))))
        .join(', ')
    const problems = compact(uniq(classifiers
        .map(({ problem }) => i18n(problem, { locale }))))
        .join(', ')

    const renderProblems = problems ? ` » ${problems}` : ''

    return `${categories}${renderProblems}`
}

const formatDate = (date, timeZone, format = DATE_FORMAT) => {
    return dayjs(date).tz(timeZone).format(format)
}

const incidentToRow = async ({ task, incident, translations }) => {
    const { timeZone, locale } = task

    const where = {
        incident: { id: incident.id },
        deletedAt: null,
    }

    const incidentProperties = await loadIncidentPropertiesForExcelExport({ where })

    const incidentClassifierIncidents = await loadIncidentClassifierIncidentsForExcelExport({ where })

    const classifierIds = uniq(incidentClassifierIncidents.map(({ classifier }) => classifier))

    const classifiers = await loadIncidentClassifiersForExcelExport({
        where: {
            id_in: classifierIds,
        },
    })

    const properties = incidentProperties.map(({ property, propertyAddress, propertyDeletedAt }) => {
        if (!!propertyDeletedAt || !property) {
            return propertyAddress + ' - ' + translations.PropertyWasDeleted
        }
        return property
    })

    const isActual = incident.status === INCIDENT_STATUS_ACTUAL

    return {
        number: incident.number,
        addresses: incident.hasAllProperties
            ? translations.AllProperties
            : properties.join(';\n'),
        classifiers: classifiersToString(classifiers, locale),
        details: incident.details,
        status: isActual ? translations.Actual : translations.NotActual,
        workStart: incident.workStart ? formatDate(incident.workStart, timeZone) : EMPTY_VALUE,
        workFinish: incident.workFinish ? formatDate(incident.workFinish, timeZone) : EMPTY_VALUE,
        workType: incident.workType ? translations.WorkTypes[incident.workType] : EMPTY_VALUE,
        organization: incident.organization,
        textForResident: incident.textForResident || EMPTY_VALUE,
        createdBy: incident.createdBy,
        createdAt: incident.createdAt ? formatDate(incident.createdAt, timeZone) : EMPTY_VALUE,
    }
}

const buildExportFile = async ({ task, rows }) => {
    const { id, where, timeZone, locale } = task

    const createdAtGte = get(findAllByKey(where, 'createdAt_gte'), 0)
    const createdAtLte = get(findAllByKey(where, 'createdAt_lte'), 0)

    const headerMessage = createdAtGte && createdAtLte
        ? `${i18n('excelExport.headers.incidents.forPeriod.title', { locale })} ${formatDate(createdAtGte, timeZone)} — ${formatDate(createdAtLte, timeZone)}`
        : i18n('excelExport.headers.incidents.title', { locale })

    const { stream } = await buildExportExcelFile({
        templatePath: './domains/ticket/templates/IncidentsExportTemplate.xlsx',
        replaces: {
            header: headerMessage,
            incidents: rows,
            i18n: {
                ...getHeadersTranslations(EXPORT_TYPE_INCIDENTS, locale),
                sheetName: i18n('excelExport.sheetNames.incidents', { locale }),
            },
        },
    })

    return {
        stream,
        filename: `incidents_${formatDate(undefined, timeZone, 'DD_MM_YYYY')}.xlsx`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'IncidentExportTask',
            id,
        },
    }
}

async function exportIncidents (taskId) {
    if (!taskId) {
        taskLogger.error({
            msg: 'taskId is undefined',
        })
        throw new Error('taskId is undefined')
    }

    const { keystone: context } = getSchemaCtx('IncidentExportTask')

    const task = await IncidentExportTask.getOne(context, { id: taskId }, 'id timeZone format where sortBy locale')
    if (!task) {
        taskLogger.error({
            msg: 'No task with specified id',
            entityId: taskId,
            entity: 'IncidentExportTask',
        })
        throw new Error(`No task with id "${taskId}"`)
    }

    const { where, sortBy, format, locale } = task

    try {
        if (!locale) {
            throw new Error(`IncidentExportTask with id "${taskId}" does not have value for "locale" field!`)
        }

        setLocaleForKeystoneContext(context, locale)

        const translations = buildTranslations(locale)

        const totalRecordsCount = await Incident.count(context, where)

        const incidentLoader = await buildIncidentsLoader({ where, sortBy })

        const convertRecordToFileRow = async (incident) => await incidentToRow({
            task,
            incident,
            translations,
        })

        const loadRecordsBatch = async (offset, limit) => {
            const incidents = await incidentLoader.loadChunk(offset, limit)

            this.progress(Math.floor(offset / totalRecordsCount * 100))

            return incidents
        }

        switch (format) {
            case EXCEL: {
                if (totalRecordsCount > MAX_XLSX_FILE_ROWS) {
                    await exportRecordsAsCsvFile({
                        context,
                        loadRecordsBatch,
                        convertRecordToFileRow,
                        baseAttrs: BASE_ATTRIBUTES,
                        taskServerUtils: IncidentExportTask,
                        totalRecordsCount,
                        taskId,
                        registry: EXPORT_TYPE_INCIDENTS,
                    })
                } else {
                    await exportRecordsAsXlsxFile({
                        context,
                        loadRecordsBatch,
                        convertRecordToFileRow,
                        buildExportFile: (rows) => buildExportFile({ rows, task }),
                        baseAttrs: BASE_ATTRIBUTES,
                        taskServerUtils: IncidentExportTask,
                        totalRecordsCount,
                        taskId,
                    })
                }
            }
        }
    } catch (err) {
        await IncidentExportTask.update(context, taskId, {
            ...BASE_ATTRIBUTES,
            status: ERROR,
        })

        taskLogger.error({
            msg: 'failed to export incidents',
            entityId: taskId,
            entity: 'IncidentExportTask',
            err,
        })

        throw err
    }
}

module.exports = {
    exportIncidents: createTask('exportIncidents', exportIncidents, 'low'),
}
