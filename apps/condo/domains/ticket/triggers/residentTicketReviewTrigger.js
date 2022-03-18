const { STATUS_IDS } = require('../constants/statusTransitions')
const { RESIDENT } = require('@condo/domains/user/constants/common')

const residentTicketReviewTrigger = {
    rule: {
        conditions: {
            all: [
                {
                    fact: 'operation',
                    operator: 'equal',
                    value: 'update',
                },
                {
                    fact: 'context',
                    path: '$.req.user.type',
                    operator: 'equal',
                    value: RESIDENT,
                },
                {
                    fact: 'data',
                    path: '$.resolvedData.reviewValue',
                    operator: 'notEqual',
                    value: undefined,
                },
                {
                    fact: 'data',
                    path: '$.existingItem.status',
                    operator: 'equal',
                    value: STATUS_IDS.COMPLETED,
                },
                {
                    fact: 'listKey',
                    operator: 'equal',
                    value: 'Ticket',
                },
            ],
        },
        event: {
            type: 'residentTicketReviewTrigger',
        },
    },
    action: ({ data: { resolvedData } }) => {
        if (resolvedData.reviewValue === '0') {
            resolvedData['status'] = STATUS_IDS.OPEN
        } else {
            resolvedData['status'] = STATUS_IDS.CLOSED
        }
    },
}

module.exports = {
    residentTicketReviewTrigger,
}
