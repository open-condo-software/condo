const { GQLCustomSchema } = require('@core/keystone/schema')
const conf = require('@core/config')
const access = require('@condo/domains/ticket/access/ExportTicketsService')
const { TicketStatus, loadTicketsForExcelExport } = require('@condo/domains/ticket/utils/serverSchema')
const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { NOTHING_TO_EXPORT } = require('@condo/domains/common/constants/errors')
const DATE_FORMAT = 'DD.MM.YYYY HH:mm'
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const { extractReqLocale } = require('@condo/domains/common/utils/locale')
const { i18n } = require('@condo/domains/common/utils/localesLoader')
const { REVIEW_VALUES } = require('@condo/domains/ticket/constants')
const { getHeadersTranslations, EXPORT_TYPE_TICKETS } = require('@condo/domains/common/utils/exportToExcel')
const { ticketStatusesTranslations } = require('@condo/domains/common/utils/exportToExcel')
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
                const formatDate = (date) => dayjs(date).tz(timeZone).format(DATE_FORMAT)
                const statuses = await TicketStatus.getAll(context, {})
                const indexedStatuses = Object.fromEntries(statuses.map(status => ([status.type, status.name])))
                const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE
                const reviewValueText = {
                    [REVIEW_VALUES.BAD]: i18n('ticket.reviewValue.bad', { locale }),
                    [REVIEW_VALUES.GOOD]: i18n('ticket.reviewValue.good', { locale }),
                }
                const isEmergency = i18n('ticket.export.isEmergency', { locale })
                const isWarranty = i18n('ticket.export.isWarranty', { locale })
                const isPaid = i18n('ticket.export.isPaid', { locale })

                const allTickets = await loadTicketsForExcelExport({ where, sortBy })
                if (allTickets.length === 0) {
                    throw new GQLError(errors.NOTHING_TO_EXPORT, context)
                }
                const excelRows = allTickets.map(ticket => {
                    const comments = [...new Set(ticket.TicketComment || [])]
                    return {
                        number: ticket.number,
                        organization: ticket.organization,
                        property: ticket.property,
                        unitName: ticket.unitName,
                        entranceName: ticket.sectionName,
                        floorName: ticket.floorName,
                        clientName: ticket.clientName,
                        clientPhone: ticket.clientPhone,
                        details: ticket.details,
                        isEmergency: ticket.isEmergency ? isEmergency : '',
                        isWarranty: ticket.isWarranty ? isWarranty : '',
                        isPaid: ticket.isPaid ? isPaid : '',
                        place: ticket.place || '',
                        category: ticket.category || '',
                        description: ticket.problem || '',
                        createdAt: formatDate(ticket.createdAt),
                        updatedAt: formatDate(ticket.updatedAt),
                        inworkAt: ticket.startedAt ? formatDate(ticket.startedAt) : '',
                        completedAt: ticket.completedAt ? formatDate(ticket.completedAt) : '',
                        status: indexedStatuses[ticket.status],
                        operator: ticket.operator || ticket.createdBy || '',
                        executor: ticket.executor || '',
                        assignee: ticket.assignee || '',
                        comments: comments.map(comment => comment.split(':').pop()).join(TICKET_COMMENTS_SEPARATOR),
                        source: ticket.source || '',
                        deadline: ticket.deadline ? formatDate(ticket.deadline) : '',
                        reviewValue: ticket.reviewValue ? reviewValueText[ticket.reviewValue] : '',
                        reviewComment: ticket.reviewComment || '',
                        statusReopenedCounter: ticket.statusReopenedCounter || '',
                    }
                })

                const linkToFile = await createExportFile({
                    fileName: `tickets_${dayjs().format('DD_MM')}.xlsx`,
                    templatePath: './domains/ticket/templates/TicketsExportTemplate.xlsx',
                    replaces: {
                        tickets: excelRows,
                        i18n: {
                            ...getHeadersTranslations(EXPORT_TYPE_TICKETS, locale),
                            sheetName: i18n('excelExport.sheetNames.tickets', { locale }),

                            // These statuses are needed to set cell color using conditional formatting by status name.
                            statusNames: ticketStatusesTranslations(locale),
                        },
                    },
                    meta: {
                        listkey: 'Ticket',
                        id: allTickets[0].id,
                    },
                })

                return { status: 'ok', linkToFile }
            },
        },
    ],
    mutations: [],
})

module.exports = {
    ExportTicketsService,
}
