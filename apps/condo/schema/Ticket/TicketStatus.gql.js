const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const TICKET_FIELDS = '{ id dv name }'
const TicketStatus = genTestGQLUtils('TicketStatus', TICKET_FIELDS)

module.exports = {
    TicketStatus,
    TICKET_FIELDS,
}
