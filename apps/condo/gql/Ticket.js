const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const TICKET_FIELDS = '{ id dv sender organization { id name } property { id name address } status { id name type organization { id } } statusReason statusReopenedCounter number client { id name } clientName clientEmail unitName clientPhone operator { id name } assignee { id name phone } executor { id name phone } watchers { id name } classifier { id name organization { id } parent { id name } } details related { id details } meta source { id name type } sourceMeta v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt isEmergency paid statusUpdatedAt }'
const Ticket = genTestGQLUtils('Ticket', TICKET_FIELDS)

const TICKET_STATUS_FIELDS = '{ id dv name type }'
const TicketStatus = genTestGQLUtils('TicketStatus', TICKET_STATUS_FIELDS)

module.exports = {
    Ticket,
    TicketStatus,
}
