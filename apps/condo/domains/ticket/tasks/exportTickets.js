const dayjs = require('dayjs')
const compact = require('lodash/compact')
const get = require('lodash/get')
const isNull = require('lodash/isNull')
const map = require('lodash/map')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { i18n } = require('@open-condo/locales/loader')

const { ERROR, PDF } = require('@condo/domains/common/constants/export')
const { EXCEL } = require('@condo/domains/common/constants/export')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { buildExportFile: _buildExportFile, EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { findAllByKey } = require('@condo/domains/common/utils/ecmascript.utils')
const { getHeadersTranslations, EXPORT_TYPE_TICKETS, ticketStatusesTranslations } = require('@condo/domains/common/utils/exportToExcel')
const { exportRecordsAsXlsxFile, exportRecordsAsCsvFile } = require('@condo/domains/common/utils/serverSchema/export')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } = require('@condo/domains/ticket/constants')
const { FEEDBACK_ADDITIONAL_OPTIONS_BY_KEY, FEEDBACK_VALUES_BY_KEY } = require('@condo/domains/ticket/constants/feedback')
const { QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY, QUALITY_CONTROL_VALUES_BY_KEY } = require('@condo/domains/ticket/constants/qualityControl')
const { TICKET_EXPORT_TASK_OPTIONS_FIELDS } = require('@condo/domains/ticket/gql')
const { convertQualityControlOrFeedbackOptionsToText, filterFeedbackOptionsByScore, filterQualityControlOptionsByScore } = require( '@condo/domains/ticket/utils')
const { buildTicketsLoader, loadTicketCommentsForExcelExport, loadClassifiersForExcelExport } = require('@condo/domains/ticket/utils/serverSchema')
const { TicketExportTask, TicketStatus, Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { exportTicketBlanksToPdf } = require('@condo/domains/ticket/utils/serverSchema/exportTicketBlanksToPdf')
const { RESIDENT } = require('@condo/domains/user/constants/common')


const appLogger = getLogger('condo')
const taskLogger = appLogger.child({ module: 'exportTickets' })

const TICKET_COMMENTS_SEPARATOR = '\n' + '—'.repeat(20) + '\n'

const COMMENT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

const DATE_FORMAT = 'DD.MM.YYYY HH:mm'
const HEADER_DATE_FORMAT = 'DD.MM.YYYY'

const EMPTY_VALUE = '—'

// Exporting large amount of records into Excel crashes server Pod because it gets out of memory
// When records count is more than this constant, CSV file will be generated instead of Excel
const MAX_XLSX_FILE_ROWS = 3000

const buildFeedbackValuesTranslationsFrom = (locale) => ({
    [FEEDBACK_VALUES_BY_KEY.BAD]: i18n('ticket.feedback.bad', { locale }),
    [FEEDBACK_VALUES_BY_KEY.GOOD]: i18n('ticket.feedback.good', { locale }),
})

const buildFeedbackAdditionalOptionsTranslationsFrom = (locale) => ({
    [FEEDBACK_ADDITIONAL_OPTIONS_BY_KEY.LOW_QUALITY]: i18n('ticket.feedback.options.lowQuality', { locale }).toLowerCase(),
    [FEEDBACK_ADDITIONAL_OPTIONS_BY_KEY.SLOWLY]: i18n('ticket.feedback.options.slowly', { locale }).toLowerCase(),
    [FEEDBACK_ADDITIONAL_OPTIONS_BY_KEY.HIGH_QUALITY]: i18n('ticket.feedback.options.highQuality', { locale }).toLowerCase(),
    [FEEDBACK_ADDITIONAL_OPTIONS_BY_KEY.QUICKLY]: i18n('ticket.feedback.options.quickly', { locale }).toLowerCase(),
})

const buildQualityControlValuesTranslationsFrom = (locale) => ({
    [QUALITY_CONTROL_VALUES_BY_KEY.BAD]: i18n('ticket.qualityControl.bad', { locale }),
    [QUALITY_CONTROL_VALUES_BY_KEY.GOOD]: i18n('ticket.qualityControl.good', { locale }),
})

const buildQualityControlAdditionalOptionsTranslationsFrom = (locale) => ({
    [QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.LOW_QUALITY]: i18n('ticket.qualityControl.options.lowQuality', { locale }).toLowerCase(),
    [QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.SLOWLY]: i18n('ticket.qualityControl.options.slowly', { locale }).toLowerCase(),
    [QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.HIGH_QUALITY]: i18n('ticket.qualityControl.options.highQuality', { locale }).toLowerCase(),
    [QUALITY_CONTROL_ADDITIONAL_OPTIONS_BY_KEY.QUICKLY]: i18n('ticket.qualityControl.options.quickly', { locale }).toLowerCase(),
})

const renderComment = (comment, locale, timeZone) => {
    const createdAt = dayjs(comment.createdAt).tz(timeZone).format(COMMENT_DATE_FORMAT)
    const createdBy = comment.userName
    const userType = comment.userType === RESIDENT ? i18n('Contact', { locale }) : i18n('Employee', { locale })
    const content = comment.content
    const filesCount = comment.TicketCommentFiles
    const filesCountToRender = filesCount > 0 ? `(${i18n('excelExport.tickets.ticketCommentFilesCount', { locale })}: ${filesCount})` : ''

    return `${createdAt}, ${createdBy} (${userType}): «${content}» ${filesCountToRender}`
}

const renderFeedbackAdditionalOptions = (ticket, locale) => {
    if (!ticket.feedbackAdditionalOptions || !ticket.feedbackValue) return null

    const optionsTranslations = buildFeedbackAdditionalOptionsTranslationsFrom(locale)

    const selectedOption = filterFeedbackOptionsByScore(ticket.feedbackValue, ticket.feedbackAdditionalOptions)
    return convertQualityControlOrFeedbackOptionsToText(selectedOption, optionsTranslations)
}

const renderQualityControlAdditionalOptions = (ticket, locale) => {
    if (!ticket.qualityControlAdditionalOptions || !ticket.qualityControlValue) return null

    const optionsTranslations = buildQualityControlAdditionalOptionsTranslationsFrom(locale)

    const selectedOption = filterQualityControlOptionsByScore(ticket.qualityControlValue, ticket.qualityControlAdditionalOptions)
    return convertQualityControlOrFeedbackOptionsToText(selectedOption, optionsTranslations)
}

function _getTranslatedClassifier (translationId, locale) {
    if (!translationId) return EMPTY_VALUE

    return i18n(translationId, { locale })
}

/**
 * Converts record obtained from database to JSON representation for file row
 *
 * @param task
 * @param ticket - record of Ticket with related objects converted by `GqlWithKnexLoadList` to its display names (for example `Ticket.source` -> `Ticket.source.name`)
 * @param indexedStatuses
 * @param classifier
 * @return {Promise<{clientName, deferredUntil: (*|string), description: string, source: (string|string), feedbackComment: string, operator: string, unitType: (string|string), number, isEmergency: string, createdAt: *, statusReopenedCounter: (*|number|string), executor: string, contact: string, property: (*|string), details, isWarranty: string, floorName, place: string, organizationComments: (string|string), closedAt: (*|string), deadline: (*|string), entranceName: (string|string), updatedAt: *, inworkAt: (*|string), completedAt: (*|string), residentComments: (string|string), feedbackAdditionalOptions: (*|string), unitName, clientPhone, feedbackValue: (*|string), isPayable: string, organization, assignee: string, category: string, status: *}>}
 */
const ticketToRow = async ({ task, ticket, indexedStatuses, classifier }) => {
    const { locale, timeZone } = task

    const feedbackValuesTranslations = buildFeedbackValuesTranslationsFrom(locale)
    const qualityControlValuesTranslations = buildQualityControlValuesTranslationsFrom(locale)

    const ticketClassifier = classifier.filter(rule => rule.id === ticket.classifier)

    const comments = await loadTicketCommentsForExcelExport({ ticketIds: [ticket.id] })
    const renderedOrganizationComments = []
    const renderedResidentComments = []
    comments.forEach((comment) => {
        switch (comment.type) {
            case ORGANIZATION_COMMENT_TYPE:
                renderedOrganizationComments.push(renderComment(comment, locale, timeZone))
                break
            case RESIDENT_COMMENT_TYPE:
                renderedResidentComments.push(renderComment(comment, locale, timeZone))
                break
        }
    })

    // Assume, that ticket execution was started immediately if ticket has a responsible person (assignee)
    if (ticket.assignee && !ticket.startedAt && ticket.status !== 'new_or_reopened') {
        ticket.startedAt = ticket.createdAt
    }

    const formatDate = (date) => dayjs(date).tz(timeZone).format(DATE_FORMAT)

    const YesMessage = i18n('Yes', { locale })
    const NoMessage = i18n('No', { locale })

    return {
        number: ticket.number,
        source: i18n(ticket.source, { locale }) || EMPTY_VALUE,
        organization: ticket.organization,
        property: isNull(ticket.property) ? ticket.propertyAddress : `${ticket.propertyAddress} - ${i18n('pages.condo.ticket.field.PropertyWasDeleted', { locale })}`,
        unitName: ticket.unitName,
        unitType: ticket.unitType ? i18n(`pages.condo.ticket.field.unitType.${ticket.unitType}`, { locale }) : '',
        entranceName: (ticket.sectionType && ticket.sectionName) ? `${i18n(`field.sectionType.${ticket.sectionType}`, { locale })} ${ticket.sectionName}` : '',
        floorName: ticket.floorName,
        clientName: ticket.clientName,
        contact: ticket.contact ? i18n('excelExport.tickets.ticketFromResident', { locale }) : i18n('excelExport.tickets.ticketFromNonResident', { locale }),
        clientPhone: ticket.clientPhone,
        details: ticket.details,
        isEmergency: ticket.isEmergency ? YesMessage : NoMessage,
        isPayable: ticket.isPayable ? YesMessage : NoMessage,
        isWarranty: ticket.isWarranty ? YesMessage : NoMessage,
        place: _getTranslatedClassifier(get(ticketClassifier, [0, 'place']), locale),
        category: _getTranslatedClassifier(get(ticketClassifier, [0, 'category']), locale),
        description: _getTranslatedClassifier(get(ticketClassifier, [0, 'problem']), locale),
        createdAt: formatDate(ticket.createdAt),
        inworkAt: ticket.startedAt ? formatDate(ticket.startedAt) : EMPTY_VALUE,
        completedAt: ticket.completedAt ? formatDate(ticket.completedAt) : EMPTY_VALUE,
        closedAt: ticket.closedAt ? formatDate(ticket.closedAt) : EMPTY_VALUE,
        updatedAt: formatDate(ticket.updatedAt),
        status: indexedStatuses[ticket.status],
        deferredUntil: ticket.deferredUntil ? formatDate(ticket.deferredUntil) : EMPTY_VALUE,
        operator: ticket.createdBy || EMPTY_VALUE,
        executor: ticket.executor || EMPTY_VALUE,
        assignee: ticket.assignee || EMPTY_VALUE,
        organizationComments: renderedOrganizationComments.join(TICKET_COMMENTS_SEPARATOR) || EMPTY_VALUE,
        residentComments: renderedResidentComments.join(TICKET_COMMENTS_SEPARATOR) || EMPTY_VALUE,
        deadline: ticket.deadline ? formatDate(ticket.deadline) : EMPTY_VALUE,
        feedbackValue: ticket.feedbackValue ? feedbackValuesTranslations[ticket.feedbackValue] : EMPTY_VALUE,
        feedbackComment: ticket.feedbackComment || EMPTY_VALUE,
        feedbackAdditionalOptions: renderFeedbackAdditionalOptions(ticket, locale) || EMPTY_VALUE,
        feedbackUpdatedAt: ticket.feedbackUpdatedAt ? formatDate(ticket.feedbackUpdatedAt) : EMPTY_VALUE,
        statusReopenedCounter: ticket.statusReopenedCounter || EMPTY_VALUE,
        qualityControlValue: ticket.qualityControlValue ? qualityControlValuesTranslations[ticket.qualityControlValue] : EMPTY_VALUE,
        qualityControlComment: ticket.qualityControlComment || EMPTY_VALUE,
        qualityControlAdditionalOptions: renderQualityControlAdditionalOptions(ticket, locale) || EMPTY_VALUE,
        qualityControlUpdatedAt: ticket.qualityControlUpdatedAt ? formatDate(ticket.qualityControlUpdatedAt) : EMPTY_VALUE,
        qualityControlUpdatedBy: ticket.qualityControlUpdatedBy || EMPTY_VALUE,
    }
}

const buildExportFile = async ({ rows, task }) => {
    const { where, timeZone, locale, id } = task
    const createdAtGte = get(findAllByKey(where, 'createdAt_gte'), 0)
    const createdAtLte = get(findAllByKey(where, 'createdAt_lte'), 0)

    const formatDate = (date) => dayjs(date).tz(timeZone).format(HEADER_DATE_FORMAT)

    let headerMessage = i18n('excelExport.header.tickets.forAllTime', { locale })
    if (createdAtGte && createdAtLte) {
        headerMessage = `${i18n('excelExport.header.tickets.forPeriod', { locale })} ${formatDate(createdAtGte)} — ${formatDate(createdAtLte)}`
    }

    const feedbackValuesTranslations = buildFeedbackValuesTranslationsFrom(locale)
    const qualityControlValuesTranslations = buildQualityControlValuesTranslationsFrom(locale)

    const { stream } = await _buildExportFile({
        templatePath: './domains/ticket/templates/TicketsExportTemplate.xlsx',
        replaces: {
            header: headerMessage,
            tickets: rows,
            i18n: {
                ...getHeadersTranslations(EXPORT_TYPE_TICKETS, locale),
                sheetName: i18n('excelExport.sheetNames.tickets', { locale }),

                // These statuses are needed to set cell color using conditional formatting by status name.
                statusNames: ticketStatusesTranslations(locale),

                yes: i18n('Yes', { locale }),
                feedbackValues: feedbackValuesTranslations,
                qualityControlValues: qualityControlValuesTranslations,
            },
        },
    })
    return {
        stream,
        filename: `tickets_${dayjs().format('DD_MM')}.xlsx`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'TicketExportTask',
            // Id of first record will be used by `OBSFilesMiddleware` to determine permission to access exported file
            // NOTE: Permissions check on access to exported file will be replaced to checking access on `ExportTicketsTask`
            id,
        },
    }
}

/**
 * Processor for exporting tickets job
 *
 * NOTE: Task progress should be reported to Bull via `Job` interface, which is assigned to `this` variable.
 * If this operation takes more than a timeout in Bull (30 seconds), a 'stalled' event
 * will be emitted and the job will be translated to 'failed' state
 *
 * @param taskId - id of `TicketExportTask` record, obtained from job `data` arguments
 * @returns {Promise<void>}
 */
async function exportTickets (taskId) {
    if (!taskId) throw new Error('taskId is undefined')
    const { keystone: context } = getSchemaCtx('TicketExportTask')

    let task = await TicketExportTask.getOne(context, { id: taskId }, `id timeZone format where sortBy locale options {${TICKET_EXPORT_TASK_OPTIONS_FIELDS.join(' ')}}`)
    const { where, sortBy, format } = task
    const baseAttrs = {
        dv: 1,
        sender: {
            dv: 1,
            fingerprint: TASK_WORKER_FINGERPRINT,
        },
    }

    if (!task.locale) {
        await TicketExportTask.update(context, task.id, {
            ...baseAttrs,
            status: ERROR,
        })
        throw new Error(`TicketExportTask with id "${task.id}" does not have value for "locale" field!`)
    }

    try {
        // NOTE: A field `TicketStatus.name` of type `LocalizedText` depends on `context.req` to determine current locale,
        // but here it is not used in scope of HTTP-request — it's a scope of the worker
        // which determines user requested locale from `TicketExportTask.locale` field value
        setLocaleForKeystoneContext(context, task.locale)

        const statuses = await TicketStatus.getAll(context, { deletedAt: null }, 'type name')
        const indexedStatuses = Object.fromEntries(statuses.map(status => ([status.type, status.name])))

        let classifier

        const ticketsLoader = await buildTicketsLoader({ where, sortBy })
        const totalRecordsCount = await Ticket.count(context, where)

        const convertRecordToFileRow = (ticket) => ticketToRow({ task, ticket, indexedStatuses, classifier })
        const loadRecordsBatch = async (offset, limit) => {
            const tickets = await ticketsLoader.loadChunk(offset, limit)
            const classifierRuleIds = compact(map(tickets, 'classifier'))
            classifier = await loadClassifiersForExcelExport({ classifierRuleIds })
            // See how `this` gets value of a job in `executeTask` function in `packages/keystone/tasks.js` module via `fn.apply(job, args)`
            this.progress(Math.floor(offset / totalRecordsCount * 100)) // Breaks execution after `this.progress`. Without this call it works
            return tickets
        }

        switch (format) {
            case EXCEL: {
                if (totalRecordsCount > MAX_XLSX_FILE_ROWS) {
                    await exportRecordsAsCsvFile({
                        context,
                        loadRecordsBatch,
                        convertRecordToFileRow,
                        baseAttrs,
                        taskServerUtils: TicketExportTask,
                        totalRecordsCount,
                        taskId,
                        registry: EXPORT_TYPE_TICKETS,
                    })
                } else {
                    await exportRecordsAsXlsxFile({
                        context,
                        loadRecordsBatch,
                        convertRecordToFileRow,
                        buildExportFile: (rows) => buildExportFile({ rows, task }),
                        baseAttrs,
                        taskServerUtils: TicketExportTask,
                        totalRecordsCount,
                        taskId,
                    })
                }
                break
            }
            case PDF: {
                await exportTicketBlanksToPdf({ context, task, baseAttrs, where, sortBy })
                break
            }
        }

    } catch (error) {
        await TicketExportTask.update(context, task.id, {
            ...baseAttrs,
            status: ERROR,
        })
        taskLogger.error({
            msg: 'Failed to export tickets',
            data: { id: task.id },
            error,
        })
        throw error
    }
}

module.exports = {
    exportTickets: createTask('exportTickets', exportTickets, 'low'),
}
