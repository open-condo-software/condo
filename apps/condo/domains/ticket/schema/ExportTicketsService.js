const { GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@condo/domains/ticket/access/ExportTicketsService')
const { TicketStatus, loadTicketsForExcelExport } = require('@condo/domains/ticket/utils/serverSchema')
const moment = require('moment')
const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { EMPTY_DATA_EXPORT_ERROR } = require('@condo/domains/common/constants/errors')
const DATE_FORMAT = 'DD.MM.YYYY HH:mm'



// TODO(zuch): if we add timeZone and locale to organization settings use organization timeZone instead of client's timezone
const ExportTicketsService = new GQLCustomSchema('ExportTicketsService', {
    types: [
        {
            access: true,
            type: 'input ExportTicketsToExcelInput { where: TicketWhereInput!, sortBy: [SortTicketsBy!], timeZone: String! }',
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
                const formatDate = (date) => moment(date).tz(timeZone).format(DATE_FORMAT)
                const statuses = await TicketStatus.getAll(context, {})
                const indexedStatuses = Object.fromEntries(statuses.map(status => ([status.type, status.name])))
                const allTickets = await loadTicketsForExcelExport({ where, sortBy })
                if (allTickets.length === 0) {
                    throw new Error(`${EMPTY_DATA_EXPORT_ERROR}] empty export file`)
                }
                const excelRows = allTickets.map(ticket => {
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
                        isPaid: ticket.isPaid ? 'X' : '',
                        place: ticket.placeClassifier || '',
                        category: ticket.categoryClassifier || '',
                        description: ticket.problemClassifier || '',
                        createdAt: formatDate(ticket.createdAt),
                        updatedAt: formatDate(ticket.updatedAt),
                        inworkAt: ticket.startedAt ? formatDate(ticket.startedAt) : '',
                        completedAt: ticket.completedAt ? formatDate(ticket.completedAt) : '',
                        status: indexedStatuses[ticket.status],
                        operator: ticket.operator || '',
                        executor: ticket.executor || '',
                        assignee: ticket.assignee || '',
                        comments: ticket.TicketComment.join('\n'),
                    }
                })
                const linkToFile = await createExportFile({
                    fileName: `tickets_${moment().format('DD_MM')}.xlsx`,
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
