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
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
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
                const translations = getTranslations(locale)
                const reviewValueText = {
                    '1': translations['ticket.reviewValue.bad'],
                    '2': translations['ticket.reviewValue.good'],
                }

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
                        isEmergency: ticket.isEmergency ? 'X' : '',
                        isWarranty: ticket.isWarranty ? 'X' : '',
                        isPaid: ticket.isPaid ? 'X' : '',
                        classifier: ticket.classifier || '',
                        place: ticket.placeClassifier || '',
                        category: ticket.categoryClassifier || '',
                        description: ticket.problemClassifier || '',
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
                    replaces: { tickets: excelRows },
                    meta: {
                        listkey: 'Ticket',
                        id: allTickets[0].id,
                    },
                })
                return { status: 'ok', linkToFile }
            },
        },
    ],
    mutations: [

    ],
})

module.exports = {
    ExportTicketsService,
}
