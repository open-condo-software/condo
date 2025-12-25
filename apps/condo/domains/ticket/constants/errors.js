const UNKNOWN_GROUP_BY_FILTER = 'UNKNOWN_GROUP_BY_FILTER'
const USER_MUST_BE_SAME_AS_CREATED_BY = 'USER_MUST_BE_SAME_AS_CREATED_BY'
const TICKET_OBSERVER_TICKET_REQUIRED = '[ticketObserver:ticket:required] Ticket is required for TicketObserver create'

const CALL_RECORD_ERRORS = {
    NEGATIVE_TALK_TIME_VALUE: {
        code: 'BAD_USER_INPUT',
        type: 'NEGATIVE_TALK_TIME',
        message: 'Talk time must be positive number',
        messageForUser: 'api.ticket.callRecord.NEGATIVE_TALK_TIME',
        variable: ['data', 'talkTime'],
    },
}

const CALL_RECORD_FRAGMENT_ERRORS = {
    INVALID_TICKET_ORGANIZATION: {
        code: 'BAD_USER_INPUT',
        type: 'INVALID_TICKET_ORGANIZATION',
        message: 'The organization of the ticket must be the same as callRecord',
        messageForUser: 'api.ticket.callRecordFragment.INVALID_TICKET_ORGANIZATION',
        variable: ['data', 'ticket'],
    },
}

module.exports = {
    UNKNOWN_GROUP_BY_FILTER,
    CALL_RECORD_ERRORS,
    CALL_RECORD_FRAGMENT_ERRORS,
    USER_MUST_BE_SAME_AS_CREATED_BY,
    TICKET_OBSERVER_TICKET_REQUIRED,
}