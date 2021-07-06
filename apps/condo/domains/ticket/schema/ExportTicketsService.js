const { GQLCustomSchema } = require('@core/keystone/schema')
const { canReadTickets } = require('@condo/domains/ticket/access/Ticket')
const { Ticket, TicketClassifier } = require('@condo/domains/ticket/utils/serverSchema')
const { compact } = require('lodash')
const moment = require('moment')
const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
const get = require('lodash/get')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')

const CHUNK_SIZE = 20
const DATE_FORMAT = 'DD.MM.YYYY HH:mm'

const ExportTicketsService = new GQLCustomSchema('ExportTicketsService', {
    types: [
        {
            access: true,
            type: 'input TicketExportExcelInput { where: TicketWhereInput!, sortBy: [SortTicketsBy!] }',
        },
        {
            access: true,
            type: 'type TicketExportExcelOutput { status: String!, linkToFile: String! }',
        },
    ],
    queries: [
        {
            access: canReadTickets,
            schema: 'exportTicketsToExcel(data: TicketExportExcelInput!): TicketExportExcelOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { where, sortBy } = args.data
                const organizationId = get(where, 'organization.id')
                if (!organizationId) {
                    throw new Error('[error] no organization id is passed')
                }
                const hasAccess = await checkOrganizationPermission(context.authedItem.id, organizationId, 'canReadTickets')
                if (!hasAccess) {
                    throw new Error('[error] you do not have access to this organization')
                }
                let skip = 0
                let emergencyBreak = 1000
                let newchunk = []
                let allTickets = []
                do {
                    newchunk = await Ticket.getAll(context, where, { sortBy, first: CHUNK_SIZE, skip: skip })
                    allTickets = allTickets.concat(newchunk)
                    skip += newchunk.length
                } while (--emergencyBreak > 0 && newchunk.length)
                // TODO(zuch): add intl or change type field
                const excelRows = allTickets.map(ticket => {
                    return {
                        number: ticket.number,
                        organization: ticket.organization.name,
                        property: ticket.property.address,
                        unitName: ticket.unitName,
                        entranceName: ticket.entranceName,
                        floorName: ticket.floorName,
                        clientName: ticket.clientName,
                        clientPhone: ticket.clientPhone,
                        details: ticket.details,
                        type: compact([ticket.isEmergency ? 'Аварийная' : null, ticket.isPaid ? 'Платная' : null ]).join(', '),
                        classifier: ticket.classifier.name,
                        createdAt: moment(ticket.createdAt).format(DATE_FORMAT),
                        updatedAt: moment(ticket.updatedAt).format(DATE_FORMAT),
                        statusUpdatedAt: ticket.statusUpdatedAt ? moment(ticket.updatedAt).format(ticket.statusUpdatedAt) : '',
                        status: ticket.status.name,
                        operator: ticket.operator.name,
                        executor: ticket.executor.name,
                        assignee: ticket.assignee.name,
                        statusReason: ticket.statusReason ? ticket.statusReason : '',
                    }
                })
                const linkToFile = await createExportFile({
                    fileName: `tickets_${moment().format('DD_MM')}.ods`,
                    templatePath: './domains/ticket/templates/TicketsExportTemplate.ods',
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
