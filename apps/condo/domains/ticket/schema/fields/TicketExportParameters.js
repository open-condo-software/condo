const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const { getValidator, render } = require('@condo/domains/common/schema/json.utils')


const ajv = new Ajv()

const TICKET_EXPORT_OPTIONS_TYPE_NAME = 'TicketExportOptions'
const TICKET_EXPORT_OPTIONS_INPUT_NAME = 'TicketExportOptionsInput'

const TicketExportOptionsFields = {
    commentIds: '[String]',
    haveAllComments: 'Boolean',
    haveListCompletedWorks: 'Boolean',
    haveConsumedMaterials: 'Boolean',
    haveTotalCostWork: 'Boolean',
}

const TICKET_EXPORT_OPTIONS_TYPES = `
    type ${TICKET_EXPORT_OPTIONS_TYPE_NAME} {
        ${render(TicketExportOptionsFields)}
    }
    
    input ${TICKET_EXPORT_OPTIONS_INPUT_NAME} {
        ${render(TicketExportOptionsFields)}
    }
`

const TicketExportOptionsSchema = {
    type: 'object',
    properties: {
        commentIds: { type: 'array', items: { type: 'string' } },
        haveAllComments: { type: 'boolean' },
        haveListCompletedWorks: { type: 'boolean' },
        haveConsumedMaterials: { type: 'boolean' },
        haveTotalCostWork: { type: 'boolean' },
    },
    additionalProperties: false,
}

const ticketExportOptionValidator = getValidator(ajv.compile(TicketExportOptionsSchema))

const TICKET_EXPORT_OPTIONS_FIELD = {
    schemaDoc: 'Options for exporting tickets into PDF format',
    type: Json,
    graphQLInputType: TICKET_EXPORT_OPTIONS_INPUT_NAME,
    graphQLReturnType: TICKET_EXPORT_OPTIONS_TYPE_NAME,
    extendGraphQLTypes: [TICKET_EXPORT_OPTIONS_TYPES],
    hooks: {
        validateInput: ticketExportOptionValidator,
    },
    access: {
        read: true,
        create: true,
        update: false,
    },
}

module.exports = {
    TICKET_EXPORT_OPTIONS_FIELD,
}
