const setInitialStatusTrigger = {
    rule: {
        conditions: {
            all: [
                {
                    fact: 'operation',
                    operator: 'equal',
                    value: 'update',
                },
                {
                    fact: 'data',
                    path: '$.resolvedData.status',
                    operator: 'equal',
                    value: undefined,
                },
                {
                    fact: 'data',
                    path: '$.resolvedData.assignee',
                    operator: 'notEqual',
                    value: undefined,
                },
                /*
                 *   TODO(Dimitreee): add custom fact which will fetch all organization statuses and get only new_or_reopened type
                 *   see: https://github.com/CacheControl/json-rules-engine/blob/master/docs/facts.md
                 * */
                {
                    fact: 'data',
                    path: '$.existingItem.status',
                    operator: 'in',
                    value: ['6ef3abc4-022f-481b-90fb-8430345ebfc2'],
                },
                {
                    fact: 'listKey',
                    operator: 'equal',
                    value: 'Ticket',
                },
            ],
        },
        event: {
            type: 'setInitialStatusTrigger',
        },
    },
    action: ({ data: { resolvedData } }) => {
        // TODO(Dimitreee): add SDl to triggers action, think about solution
        // TODO(Dimitreee): should fetch this status from organization settings?
        const IN_PROGRESS = 'aa5ed9c2-90ca-4042-8194-d3ed23cb7919'
        resolvedData['status'] = IN_PROGRESS
    },
}

module.exports = {
    setInitialStatusTrigger,
}
