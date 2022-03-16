const { STATUS_IDS } = require('../constants/statusTransitions')

const incrementStatusReopenedCounterTrigger = {
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
                    path: '$.existingItem.status',
                    operator: 'equal',
                    value: STATUS_IDS.COMPLETED,
                },
                {
                    fact: 'data',
                    path: '$.resolvedData.status',
                    operator: 'equal',
                    value: STATUS_IDS.OPEN,
                },
                {
                    fact: 'listKey',
                    operator: 'equal',
                    value: 'Ticket',
                },
            ],
        },
        event: {
            type: 'incrementStatusReopenedCounterTrigger',
        },
    },
    action: ({ data: { resolvedData, existingItem } }) => {
        const existedStatusReopenedCounter = existingItem['statusReopenedCounter']
        resolvedData['statusReopenedCounter'] = existedStatusReopenedCounter + 1
    },
}

module.exports = {
    incrementStatusReopenedCounterTrigger,
}
