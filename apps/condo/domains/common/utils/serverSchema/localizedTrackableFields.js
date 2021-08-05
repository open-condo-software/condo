const { TicketStatus } = require('@condo/domains/ticket/schema/TicketStatus')

// TODO(MrFoxPro): refactor this logic
module.exports = new Map([['status', TicketStatus.schema.fields.name.template]])