const dayjs = require('dayjs')
const get = require('lodash/get')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

const { GQLCustomSchema } = require('@core/keystone/schema')
const conf = require('@core/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')

const { extractReqLocale } = require('@condo/domains/common/utils/locale')
const { i18n } = require('@condo/domains/common/utils/localesLoader')
const { REVIEW_VALUES, ORGANIZATION_COMMENT_TYPE, RESIDENT_COMMENT_TYPE } = require('@condo/domains/ticket/constants')
const { getHeadersTranslations, EXPORT_TYPE_TICKETS } = require('@condo/domains/common/utils/exportToExcel')
const { ticketStatusesTranslations } = require('@condo/domains/common/utils/exportToExcel')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { TicketStatus, loadTicketsBatchForExcelExport, loadTicketCommentsForExcelExport } = require('@condo/domains/ticket/utils/serverSchema')
const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const access = require('@condo/domains/ticket/access/ExportTicketsService')
const { NOTHING_TO_EXPORT } = require('@condo/domains/common/constants/errors')
const { findAllByKey } = require('@condo/domains/common/utils/ecmascript.utils')
const { isNull } = require('lodash')
const { EXCEL } = require('@condo/domains/common/constants/export')
const { startExportJob } = require('@condo/domains/common/utils/serverSchema/exportRecords')
const { ExportTicketTask } = require('../utils/serverSchema')

const HEADER_DATE_FORMAT = 'DD.MM.YYYY'
const DATE_FORMAT = 'DD.MM.YYYY HH:mm'

dayjs.extend(utc)
dayjs.extend(timezone)

const TICKET_COMMENTS_SEPARATOR = '\n' + '—'.repeat(20) + '\n'

const errors = {
    NOTHING_TO_EXPORT: {
        query: 'exportTicketsToExcel',
        variable: ['data', 'property'],
        code: BAD_USER_INPUT,
        type: NOTHING_TO_EXPORT,
        message: 'No tickets found to export',
        messageForUser: 'api.ticket.exportTicketsToExcel.NOTHING_TO_EXPORT',
    },
}

const COMMENT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

const renderComment = (comment, locale) => {
    const createdAt = dayjs(comment.createdAt).format(COMMENT_DATE_FORMAT)
    const createdBy = comment.userName
    const userType = comment.userType === RESIDENT ? i18n('Contact', { locale }) : i18n('Employee', { locale })
    const content = comment.content
    const filesCount = comment.TicketCommentFiles
    const filesCountToRender = filesCount > 0 ? `(${i18n('excelExport.tickets.ticketCommentFilesCount', { locale })}: ${filesCount})` : ''

    return `${createdAt}, ${createdBy} (${userType}): ${content ? `«${content}»` : ''} ${filesCountToRender}`
}

const EMPTY_VALUE = '—'

// TODO(zuch): if we add timeZone and locale to organization settings use organization timeZone instead of client's timezone
const ExportTicketsService = new GQLCustomSchema('ExportTicketsService', {
    types: [
        {
            access: true,
            type: 'input ExportTicketsToExcelInput { dv: Int!, sender: SenderFieldInput!, where: TicketWhereInput!, sortBy: [SortTicketsBy!], timeZone: String! }',
        },
        {
            access: true,
            type: 'type ExportTicketsToExcelOutput { status: String!, linkToFile: String! }',
        },
    ],
    queries: [
        {
            access: access.canExportTicketsToExcel,
            schema: 'exportTicketsToExcel(data: ExportTicketsToExcelInput!): ExportTicketsToExcelOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { where, sortBy, timeZone: timeZoneFromUser } = args.data
                const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
                const formatDate = (date, dateFormat = DATE_FORMAT) => dayjs(date).tz(timeZone).format(dateFormat)
                const statuses = await TicketStatus.getAll(context, {})
                const indexedStatuses = Object.fromEntries(statuses.map(status => ([status.type, status.name])))
                const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE

                const reviewValueText = {
                    [REVIEW_VALUES.BAD]: i18n('ticket.reviewValue.bad', { locale }),
                    [REVIEW_VALUES.GOOD]: i18n('ticket.reviewValue.good', { locale }),
                }

                const task = await startExportJob({
                    format: EXCEL,
                    taskServerUtils: ExportTicketTask,
                    loadRecords: async (offset, limit) => {
                        // This function produces one SQL query and it is quite lite for database
                        const tickets = await loadTicketsBatchForExcelExport({ where, sortBy, offset, limit })
                        if (tickets.length === 0) {
                            throw new GQLError(errors.NOTHING_TO_EXPORT, context)
                        }
                    },
                    convertRecord: async (ticket) => {
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
                    },
                    saveToFile: async ({ rows }) => {
                        const createdAtGte = get(findAllByKey(where, 'createdAt_gte'), 0)
                        const createdAtLte = get(findAllByKey(where, 'createdAt_lte'), 0)

                        let headerMessage = i18n('excelExport.header.tickets.forAllTime', { locale })
                        if (createdAtGte && createdAtLte) {
                            headerMessage = `${i18n('excelExport.header.tickets.forPeriod', { locale })} ${formatDate(createdAtGte, HEADER_DATE_FORMAT)} — ${formatDate(createdAtLte, HEADER_DATE_FORMAT)}`
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
                    },

                })

                return { task }
            },
        },
    ],
    mutations: [],
})

module.exports = {
    ExportTicketsService,
}
