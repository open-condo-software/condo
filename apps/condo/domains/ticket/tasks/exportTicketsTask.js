const { isNull, get } = require('lodash')
const { ExportTicketTask } = require('../utils/serverSchema')
const { PROCESSING } = require('@condo/domains/common/constants/export')
const { exportRecords } = require('@condo/domains/common/utils/serverSchema/export')
const { createTask } = require('@core/keystone/tasks')
const { getSchemaCtx } = require('@core/keystone/schema')
const { loadTicketsBatchForExcelExport, loadTicketCommentsForExcelExport, TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const { ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE, REVIEW_VALUES } = require('@condo/domains/ticket/constants')
const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
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
 * Loads records batch
 *
 * @param offset
 * @param limit
 * @return {Promise<void>}
 */
const loadRecordsBatch = async ({ task, offset, limit }) => {
    const { where, sortBy } = task
    // This function produces one SQL query and it is quite lite for database
    const tickets = await loadTicketsBatchForExcelExport({ where, sortBy, offset, limit })
    return tickets
}

/**
 * Converts record obtained from database to JSON representation for file row
 *
 * @param ticket
 * @return {Promise<{clientName, description: string, source: string, operator: (*|string), number, isEmergency: (string), createdAt: *, statusReopenedCounter: string, executor: string, property, classifier: string, details, isWarranty: (string), floorName, place: string, organizationComments: string, deadline: (*|string), entranceName, updatedAt: *, inworkAt: (*|string), completedAt: (*|string), residentComments: string, unitName, reviewComment: (*|string), clientPhone, isPaid: (string), organization, assignee: string, category: string, reviewValue: (*|string), status}>}
 */
const convertRecordToFileRow = async ({ task, ticket, indexedStatuses }) => {
    const { locale, timeZone } = task

    const reviewValueText = {
        [REVIEW_VALUES.BAD]: i18n('ticket.reviewValue.bad', { locale }),
        [REVIEW_VALUES.GOOD]: i18n('ticket.reviewValue.good', { locale }),
    }

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
        source: ticket.source || EMPTY_VALUE,
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
        place: ticket.placeClassifier || EMPTY_VALUE,
        category: ticket.categoryClassifier || EMPTY_VALUE,
        description: ticket.problemClassifier || EMPTY_VALUE,
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
        reviewValue: ticket.reviewValue ? reviewValueText[ticket.reviewValue] : EMPTY_VALUE,
        reviewComment: ticket.reviewComment || EMPTY_VALUE,
        statusReopenedCounter: ticket.statusReopenedCounter || EMPTY_VALUE,
        organizationComments: renderedOrganizationComments.join(TICKET_COMMENTS_SEPARATOR),
        residentComments: renderedResidentComments.join(TICKET_COMMENTS_SEPARATOR),
    }
}

const saveToFile = async ({ rows, task }) => {
    const { where, timeZone, locale } = task
    const createdAtGte = get(findAllByKey(where, 'createdAt_gte'), 0)
    const createdAtLte = get(findAllByKey(where, 'createdAt_lte'), 0)

    const formatDate = (date) => dayjs(date).tz(timeZone).format(HEADER_DATE_FORMAT)

    let headerMessage = i18n('excelExport.header.tickets.forAllTime', { locale })
    if (createdAtGte && createdAtLte) {
        headerMessage = `${i18n('excelExport.header.tickets.forPeriod', { locale })} ${formatDate(createdAtGte)} — ${formatDate(createdAtLte)}`
    }

    const reviewValueText = {
        [REVIEW_VALUES.BAD]: i18n('ticket.reviewValue.bad', { locale }),
        [REVIEW_VALUES.GOOD]: i18n('ticket.reviewValue.good', { locale }),
    }

    await createExportFile({
        fileName: `tickets_${dayjs().format('DD_MM')}.xlsx`,
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
                reviewValues: reviewValueText,
            },
        },
        meta: {
            listkey: 'Ticket',
            // Used for determining access rights on read exported file by reading access to Ticket with specified `id`
            // id: allTickets[0].id,
        },
    })
}

const exportTickets = async (taskId) => {
    const { keystone: context } = await getSchemaCtx('ExportTicketTask')

    const task = await ExportTicketTask.getOne(context, { id: taskId })

    const statuses = await TicketStatus.getAll(context, {})
    const indexedStatuses = Object.fromEntries(statuses.map(status => ([status.type, status.name])))

    await exportRecords({
        context,
        loadRecordsBatch: (offset, limit) => loadRecordsBatch({ context, task, offset, limit }),
        convertRecordToFileRow: (ticket) => convertRecordToFileRow({ task, ticket, indexedStatuses }),
        saveToFile: (rows) => saveToFile({ rows, task }),
        task,
        taskServerUtils: ExportTicketTask,
    })
}

const exportTicketsTask = createTask('exportTickets', async (taskId) => {
    await exportTickets(taskId)
})

/**
 * Creates an export task, starts delayed export job and returns task
 *
 * @param context - Keystone context
 * @param taskArgs - arguments that will be saved into ExportTicketTask
 * @return {Promise<*>}
 */
async function startExportTicketsTask (context, taskArgs) {
    const { dv, sender, format, where, sortBy, locale, timeZone } = taskArgs
    const task = await ExportTicketTask.create(context, {
        dv,
        sender,
        format,
        where,
        sortBy,
        locale,
        timeZone,
        status: PROCESSING,
    })

    await exportTicketsTask.delay(task.id)

    return task
}

module.exports = {
    exportTickets,
    startExportTicketsTask,
}