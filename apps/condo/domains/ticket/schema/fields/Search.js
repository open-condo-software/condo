const dayjs = require('dayjs')

const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')


/**
 *
 * @type { SearchFieldParameter}
 */
const TICKET_SEARCH_FIELD_PARAMETERS = {
    schemaName: 'Ticket',
    simpleFields: {
        pathsToFields: [
            'number',
            'clientName',
            'propertyAddress',
            'details',
            'createdAt',
        ],
        preprocessorsForFields: {
            'createdAt': (value) => dayjs(value).format('DD-MM-YYYY'),
        },
    },
    relatedFields: [{
        schemaName: 'User',
        pathsToFields: ['assignee.name', 'executor.name'],
        schemaGql: Ticket,
    }],
}

module.exports = {
    TICKET_SEARCH_FIELD_PARAMETERS,
}
