const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const TICKET_STATUS_FIELDS = '{ id dv name }'
const TicketStatus = genTestGQLUtils('TicketStatus', TICKET_STATUS_FIELDS)

module.exports = {
    TicketStatus,
}
