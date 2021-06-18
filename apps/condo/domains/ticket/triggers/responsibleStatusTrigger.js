const responsibleStatusTrigger = {
    rule: {
        conditions: {
            all: [
                {
                    fact: 'operation',
                    operator: 'equal',
                    value: 'create',
                },
                {
                    fact: 'data',
                    path: '$.resolvedData.status',
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
            type: 'responsibleStatusTrigger',
        },
    },
    action: ({ data: { resolvedData } }) => {
        // TODO(Dimitreee): add SDl to triggers action, think about solution
        // TODO(Dimitreee): should fetch this tatus from organization settings?
        const TICKET_OPEN_STATUS_ID = '6ef3abc4-022f-481b-90fb-8430345ebfc2'
        resolvedData['status'] = TICKET_OPEN_STATUS_ID
    },
}

module.exports = {
    responsibleStatusTrigger,
}
