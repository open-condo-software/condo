const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')
const { getValidator, render } = require('@condo/domains/common/schema/json.utils')


const ajv = new Ajv()

const TICKET_EXPORT_PARAMETERS_TYPE_NAME = 'TicketExportParameters'
const TICKET_EXPORT_PARAMETERS_INPUT_NAME = 'TicketExportParametersInput'

const TicketExportParametersFields = {
    commentIds: '[String]',
    haveAllComments: 'Boolean',
    haveListCompletedWorks: 'Boolean',
    haveConsumedMaterials: 'Boolean',
    haveTotalCostWork: 'Boolean',
}

const TICKET_EXPORT_PARAMETERS_TYPES = `
    type ${TICKET_EXPORT_PARAMETERS_TYPE_NAME} {
        ${render(TicketExportParametersFields)}
    }
    
    input ${TICKET_EXPORT_PARAMETERS_INPUT_NAME} {
        ${render(TicketExportParametersFields)}
    }
`

const TicketExportParametersSchema = {
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

const ticketExportParameterValidator = getValidator(ajv.compile(TicketExportParametersSchema))

const TICKET_EXPORT_PARAMETERS_FIELD = {
    schemaDoc: 'Various options for exporting tickets',
    type: Json,
    graphQLInputType: TICKET_EXPORT_PARAMETERS_INPUT_NAME,
    graphQLReturnType: TICKET_EXPORT_PARAMETERS_TYPE_NAME,
    extendGraphQLTypes: [TICKET_EXPORT_PARAMETERS_TYPES],
    hooks: {
        validateInput: ticketExportParameterValidator,
    },
    access: {
        read: true,
        create: true,
        update: false,
    },
}

module.exports = {
    TICKET_EXPORT_PARAMETERS_FIELD,
}
