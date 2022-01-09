const Ajv = require('ajv')
const { Json } = require('@core/keystone/fields')

const { render, getValidator } = require('@condo/domains/billing/schema/fields/utils/json.utils')

const TICKET_FILTERS_TYPE_NAME = 'TicketFilters'

const TicketFiltersFields = {
    number: 'Int',
    createdAt: '[String]',
    status: '[String]',
    details: 'String',
    property: '[String]',
    address: 'String',
    division: '[String]',
    clientName: 'String',
    executor: '[String]',
    assignee: '[String]',
    executorName: 'String',
    assigneeName: 'String',
    attributes: '[String]',
    source: '[String]',
    sectionName: '[String]',
    floorName: '[String]',
    unitName: '[String]',
    placeClassifier: '[String]',
    categoryClassifier: '[String]',
    clientPhone: '[String]',
    author: '[String]',
}

const TICKET_FILTERS_TYPE = `
    type ${TICKET_FILTERS_TYPE_NAME} {
        ${render(TicketFiltersFields)}
    }
`

const getTicketFiltersSchemaValueType = value => value.startsWith('[') ? { type: 'array', items: { type: 'string' } } : { type: 'string' }

const TicketFiltersSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(TicketFiltersFields).map((field) => ({ [field]: { ...getTicketFiltersSchemaValueType(TicketFiltersFields[field]) } })),
    ),
    additionalProperties: false,
}

const ajv = new Ajv()
const TicketFiltersValidator = ajv.compile(TicketFiltersSchema)

const validateTicketFilters = getValidator(TicketFiltersValidator)

const TICKET_FILTERS_FIELD = {
    schemaDoc: 'Filters that match the given template',
    type: Json,
    extendGraphQLTypes: [TICKET_FILTERS_TYPE],
    graphQLReturnType: TICKET_FILTERS_TYPE_NAME,
    isRequired: true,
    hooks: {
        validateInput: validateTicketFilters,
    },
}

module.exports = {
    TICKET_FILTERS_FIELD,
}