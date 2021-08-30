const { GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@condo/domains/ticket/access/ExportTicketsService')
const { Ticket, TicketComment, TicketChange, TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const moment = require('moment')
const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
const { has, get } = require('lodash')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { loadModelsByChunks } = require('@condo/domains/common/utils/serverSchema')
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

                const allTickets = await loadModelsByChunks({
                    context,
                    model: Ticket,
                    where,
                    sortBy,
                    chunkSize: 20,
                    limit: 10000,
                })

                if (allTickets.length === 0) {
                    throw new Error(`${EMPTY_DATA_EXPORT_ERROR}] empty export file`)
                }
                const ticketIds = allTickets.map(ticket => ticket.id)

                const comments = await loadModelsByChunks({
                    context,
                    model: TicketComment,
                    where: { ticket: { id_in: ticketIds } },
                })

                const indexedComments = {}
                comments.forEach(comment => {
                    if (!has(indexedComments, comment.ticket.id)) {
                        indexedComments[comment.ticket.id] = []
                    }
                    indexedComments[comment.ticket.id].push(comment.content)
                })

                const statuses = await TicketStatus.getAll(context, { type_in: ['processing', 'canceled', 'completed'] })
                const indexedStatuses = Object.fromEntries(statuses.map(({ id, type }) => ([id, type])))

                const statusChanges = await loadModelsByChunks({
                    context,
                    model: TicketChange,
                    where: { ticket: { id_in: ticketIds }, statusIdTo_in: Object.keys(indexedStatuses) },
                })

                const statusDateByTickets = {}
                statusChanges.forEach(statusChange => {
                    if (!has(statusDateByTickets, statusChange.ticket.id)){
                        statusDateByTickets[statusChange.ticket.id] = {}
                    }
                    statusDateByTickets[statusChange.ticket.id][indexedStatuses[statusChange.statusIdTo]] = statusChange.createdAt
                })
                const excelRows = allTickets.map(ticket => {
                    let inWork = get(statusDateByTickets, `${ticket.id}.processing`, '')
                    // When ticket created with assigner it will aoutomatically get processing status on creation
                    if (ticket.status.type !== 'new_or_reopened' && !inWork) {
                        inWork = ticket.createdAt
                    }
                    const completed = get(statusDateByTickets, `${ticket.id}.completed`) ||  get(statusDateByTickets, `${ticket.id}.canceled`, '')
                    return {
                        number: ticket.number,
                        organization: ticket.organization.name,
                        property: ticket.property.address,
                        unitName: ticket.unitName,
                        entranceName: ticket.sectionName,
                        floorName: ticket.floorName,
                        clientName: ticket.clientName,
                        clientPhone: ticket.clientPhone,
                        details: ticket.details,
                        isEmergency: ticket.isEmergency ? 'X' : '',
                        isPaid: ticket.isPaid ? 'X' : '',
                        classifier: get(ticket.classifier, 'name', ''),
                        place: get(ticket.placeClassifier, 'name', ''),
                        category: get(ticket.categoryClassifier, 'name', ''),
                        description: get(ticket.problemClassifier, 'name', ''),
                        createdAt: formatDate(ticket.createdAt),
                        updatedAt: formatDate(ticket.updatedAt),
                        inworkAt: inWork ? formatDate(inWork) : '',
                        completedAt: completed ? formatDate(completed) : '',
                        status: ticket.status.name,
                        operator: get(ticket, 'operator.name', '') || get(ticket, 'createdBy.name', ''),
                        executor: get(ticket, 'executor.name', ''),
                        assignee: get(ticket, 'assignee.name', ''),
                        comments: indexedComments[ticket.id] ? indexedComments[ticket.id].join('\n') : '',
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
