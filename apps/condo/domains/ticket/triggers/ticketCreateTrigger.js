const rule = {
    conditions: {
        all: [
            {
                fact: 'operation',
                operator: 'equal',
                value: 'create',
            },
            {
                fact: 'data',
                path: '$.status',
                operator: 'equal',
                value: undefined,
            },
            {
                fact: 'listKey',
                operator: 'equal',
                value: 'Ticket',
            },
        ],
    },
    event: {
        type: 'setInitialStatus',
        params: {
            name: 'setInitialStatus',
        },
    },
    name: 'setInitialStatus',
}

const action = ({ data }) => {
    const TICKET_OPEN_STATUS_ID = '6ef3abc4-022f-481b-90fb-8430345ebfc2'
    data['status'] = TICKET_OPEN_STATUS_ID
}

const ticketCreateTrigger = {
    rule,
    action,
}

module.exports = {
    ticketCreateTrigger,
}