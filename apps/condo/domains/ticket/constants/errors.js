const UNKNOWN_GROUP_BY_FILTER = 'UNKNOWN_GROUP_BY_FILTER'

const CALL_RECORD_ERRORS = {
    NEGATIVE_TALK_TIME_VALUE: {
        code: 'BAD_USER_INPUT',
        type: 'NEGATIVE_TALK_TIME',
        message: 'Talk time must be positive number',
        messageForUser: 'api.callRecord.NEGATIVE_TALK_TIME',
        variable: ['data', 'talkTime'],
    },
}

const CALL_RECORD_FRAGMENT_ERRORS = {
    INVALID_TICKET_ORGANIZATION: {
        code: 'BAD_USER_INPUT',
        type: 'INVALID_TICKET_ORGANIZATION',
        message: 'The organization of the ticket must be the same as callRecord',
        messageForUser: 'api.callRecordFragment.INVALID_TICKET_ORGANIZATION',
        variable: ['data', 'ticket'],
    },
}

module.exports = {
    UNKNOWN_GROUP_BY_FILTER,
    CALL_RECORD_ERRORS,
    CALL_RECORD_FRAGMENT_ERRORS,
}