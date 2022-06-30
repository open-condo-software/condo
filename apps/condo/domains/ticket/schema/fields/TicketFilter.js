const Ajv = require('ajv')
const { Json } = require('@core/keystone/fields')

const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const TICKET_FILTER_TYPE_NAME = 'TicketFilter'

const TicketFilterFields = {
    organization: '[String]',
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
    deadline: '[String]',
    assigneeName: 'String',
    attributes: '[String]',
    source: '[String]',
    sectionName: '[String]',
    floorName: '[String]',
    unitType: '[String]',
    unitName: '[String]',
    placeClassifier: '[String]',
    categoryClassifier: '[String]',
    clientPhone: '[String]',
    author: '[String]',
    reviewValue: '[String]',
    contactIsNull: '[String]',
}

const TICKET_FILTER_TYPE = `
    type ${TICKET_FILTER_TYPE_NAME} {
        ${render(TicketFilterFields)}
    }
`

const getTicketFilterSchemaValueType = value => value.startsWith('[') ? { type: 'array', items: { type: 'string' } } : { type: 'string' }

const TicketFilterSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(TicketFilterFields).map((field) => ({ [field]: { ...getTicketFilterSchemaValueType(TicketFilterFields[field]) } })),
    ),
    additionalProperties: false,
}

const ajv = new Ajv()
const TicketFilterValidator = ajv.compile(TicketFilterSchema)

const validateTicketFilter = getValidator(TicketFilterValidator)

const TICKET_FILTER_FIELD = {
    schemaDoc: 'Filter that match the given template',
    type: Json,
    extendGraphQLTypes: [TICKET_FILTER_TYPE],
    graphQLReturnType: TICKET_FILTER_TYPE_NAME,
    isRequired: true,
    hooks: {
        validateInput: validateTicketFilter,
    },
}

module.exports = {
    TICKET_FILTER_FIELD,
}