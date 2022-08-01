const get = require('lodash/get')
const isNull = require('lodash/isNull')
const map = require('lodash/map')
const { TicketExportTask, TicketStatus } = require('../utils/serverSchema')
const { exportRecords } = require('@condo/domains/common/utils/serverSchema/export')
const { createTask } = require('@core/keystone/tasks')
const { getSchemaCtx } = require('@core/keystone/schema')
const { loadTicketsBatchForExcelExport, loadTicketCommentsForExcelExport, loadClassifiersForExcelExport } = require('../utils/serverSchema')
const { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE, REVIEW_VALUES } = require('@condo/domains/ticket/constants')
const { buildExportFile: _buildExportFile, EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const dayjs = require('dayjs')
const {
    getHeadersTranslations,
    EXPORT_TYPE_TICKETS,
    ticketStatusesTranslations,
} = require('@condo/domains/common/utils/exportToExcel')
const { i18n } = require('@condo/domains/common/utils/localesLoader')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { findAllByKey } = require('@condo/domains/common/utils/ecmascript.utils')

const TICKET_COMMENTS_SEPARATOR = '\n' + '—'.repeat(20) + '\n'

const COMMENT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

const DATE_FORMAT = 'DD.MM.YYYY HH:mm'
const HEADER_DATE_FORMAT = 'DD.MM.YYYY'

const EMPTY_VALUE = '—'

const buildReviewValuesTranslationsFrom = (locale) => ({
    [REVIEW_VALUES.BAD]: i18n('ticket.reviewValue.bad', { locale }),
    [REVIEW_VALUES.GOOD]: i18n('ticket.reviewValue.good', { locale }),
})

const renderComment = (comment, locale) => {
    const createdAt = dayjs(comment.createdAt).format(COMMENT_DATE_FORMAT)
    const createdBy = comment.userName
    const userType = comment.userType === RESIDENT ? i18n('Contact', { locale }) : i18n('Employee', { locale })
    const content = comment.content
    const filesCount = comment.TicketCommentFiles
    const filesCountToRender = filesCount > 0 ? `(${i18n('excelExport.ticket.ticketCommentFilesCount', { locale })}: ${filesCount})` : ''

    return `${createdAt}, ${createdBy} (${userType}): «${content}» ${filesCountToRender}`
}

/**
 * Converts record obtained from database to JSON representation for file row
 *
 * @param ticket - record of Ticket with related objects converted by `GqlWithKnexLoadList` to its display names (for example `Ticket.source` -> `Ticket.source.name`)
 * @return {Promise<{clientName, description: string, source: string, operator: (*|string), number, isEmergency: (string), createdAt: *, statusReopenedCounter: string, executor: string, property, classifier: string, details, isWarranty: (string), floorName, place: string, organizationComments: string, deadline: (*|string), entranceName, updatedAt: *, inworkAt: (*|string), completedAt: (*|string), residentComments: string, unitName, reviewComment: (*|string), clientPhone, isPaid: (string), organization, assignee: string, category: string, reviewValue: (*|string), status}>}
 */
const convertRecordToFileRow = async ({ task, ticket, indexedStatuses, classifier }) => {
    const { locale, timeZone } = task

    const reviewValuesTranslations = buildReviewValuesTranslationsFrom(locale)

    const ticketClassifier = classifier.filter(rule => rule.id === ticket.classifier)

    const comments = await loadTicketCommentsForExcelExport({ ticketIds: [ticket.id] })
    const renderedOrganizationComments = []
    const renderedResidentComments = []
    comments.forEach((comment) => {
        switch (comment.type) {
            case ORGANIZATION_COMMENT_TYPE:
                renderedOrganizationComments.push(renderComment(comment, locale))
                break
            case RESIDENT_COMMENT_TYPE:
                renderedResidentComments.push(renderComment(comment, locale))
                break
        }
    })

    // Assume, that ticket execution was started immediately if ticket has a responsible person (assignee)
    if (ticket.assignee && !ticket.startedAt && ticket.status !== 'new_or_reopened'){
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
        entranceName: ticket.sectionName,
        floorName: ticket.floorName,
        clientName: ticket.clientName,
        contact: ticket.contact ? i18n('excelExport.tickets.ticketFromResident', { locale }) : i18n('excelExport.tickets.ticketFromNonResident', { locale }),
        clientPhone: ticket.clientPhone,
        details: ticket.details,
        isEmergency: ticket.isEmergency ? YesMessage : NoMessage,
        isWarranty: ticket.isWarranty ? YesMessage : NoMessage,
        isPaid: ticket.isPaid ? YesMessage : NoMessage,
        place: get(ticketClassifier, [0, 'place']) || EMPTY_VALUE,
        category: get(ticketClassifier, [0, 'category']) || EMPTY_VALUE,
        description: get(ticketClassifier, [0, 'problem']) || EMPTY_VALUE,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt),
        inworkAt: ticket.startedAt ? formatDate(ticket.startedAt) : EMPTY_VALUE,
        completedAt: ticket.completedAt ? formatDate(ticket.completedAt) : EMPTY_VALUE,
        closedAt: ticket.closedAt ? formatDate(ticket.closedAt) : EMPTY_VALUE,
        status: indexedStatuses[ticket.status],
        operator: ticket.operator || ticket.createdBy || EMPTY_VALUE,
        executor: ticket.executor || EMPTY_VALUE,
        assignee: ticket.assignee || EMPTY_VALUE,
        deadline: ticket.deadline ? formatDate(ticket.deadline) : EMPTY_VALUE,
        reviewValue: ticket.reviewValue ? reviewValuesTranslations[ticket.reviewValue] : EMPTY_VALUE,
        reviewComment: ticket.reviewComment || EMPTY_VALUE,
        statusReopenedCounter: ticket.statusReopenedCounter || EMPTY_VALUE,
        organizationComments: renderedOrganizationComments.join(TICKET_COMMENTS_SEPARATOR),
        residentComments: renderedResidentComments.join(TICKET_COMMENTS_SEPARATOR),
    }
}

const buildExportFile = async ({ rows, task, idOfFirstTicketForAccessRights }) => {
    const { where, timeZone, locale } = task
    const createdAtGte = get(findAllByKey(where, 'createdAt_gte'), 0)
    const createdAtLte = get(findAllByKey(where, 'createdAt_lte'), 0)

    const formatDate = (date) => dayjs(date).tz(timeZone).format(HEADER_DATE_FORMAT)

    let headerMessage = i18n('excelExport.header.tickets.forAllTime', { locale })
    if (createdAtGte && createdAtLte) {
        headerMessage = `${i18n('excelExport.header.tickets.forPeriod', { locale })} ${formatDate(createdAtGte)} — ${formatDate(createdAtLte)}`
    }

    const reviewValuesTranslations = buildReviewValuesTranslationsFrom(locale)

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
                reviewValues: reviewValuesTranslations,
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
            id: idOfFirstTicketForAccessRights,
        },
    }
}

const exportTickets = async (taskId) => {
    if (!taskId) throw new Error('taskId is undefined')
    const { keystone: context } = await getSchemaCtx('TicketExportTask')

    const task = await TicketExportTask.getOne(context, { id: taskId })

    const statuses = await TicketStatus.getAll(context, {})
    const indexedStatuses = Object.fromEntries(statuses.map(status => ([status.type, status.name])))

    let idOfFirstTicketForAccessRights

    let classifier

    await exportRecords({
        context,
        loadRecordsBatch: async (offset, limit) => {
            const { where, sortBy } = task
            const tickets = await loadTicketsBatchForExcelExport({ where, sortBy, offset, limit })
            classifier = await loadClassifiersForExcelExport({ rulesIds: map(tickets, 'classifier') })

            if (!idOfFirstTicketForAccessRights) {
                idOfFirstTicketForAccessRights = get(tickets, [0, 'id'])
            }
            return tickets
        },
        convertRecordToFileRow: (ticket) => convertRecordToFileRow({ task, ticket, indexedStatuses, classifier }),
        buildExportFile: (rows) => buildExportFile({ rows, task, idOfFirstTicketForAccessRights }),
        task,
        taskServerUtils: TicketExportTask,
    })
}

const exportTicketsTask = createTask('exportTickets', async (taskId) => {
    await exportTickets(taskId)
}, {
    priority: 2,
})


module.exports = {
    exportTickets,
    exportTicketsTask,
}