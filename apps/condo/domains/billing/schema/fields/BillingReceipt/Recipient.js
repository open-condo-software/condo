const Ajv = require('ajv')
const { render, getValidator } = require('../utils/json.utils')
const { BILLING_RECEIPT_RECIPIENT_FIELD_NAME, BILLING_RECEIPT_RECIPIENT_INPUT_NAME } = require('../../../constants')
const { Json } = require('@core/keystone/fields')

const RecipientFields = {
    tin: 'String!',
    iec: 'String!',
    bic: 'String!',
    bankAccount: 'String!',
}

const RECIPIENT_GRAPHQL_TYPES = `
    type ${BILLING_RECEIPT_RECIPIENT_FIELD_NAME} {
        ${render(RecipientFields)}
    }
    
    input ${BILLING_RECEIPT_RECIPIENT_INPUT_NAME} {
        ${render(RecipientFields)}
    }
`

const RecipientSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(RecipientFields).map((field) => ({ [field]: { type: 'string' } })),
        { __typename: { type: 'string' } },
    ),
    required: Object.keys(RecipientFields),
    additionalProperties: false,
}

const ajv = new Ajv()
const RecipientValidator = ajv.compile(RecipientSchema)

const RECIPIENT_QUERY_LIST = Object.keys(RecipientFields).join(' ')

const validateRecipient = getValidator(RecipientValidator)

const RECIPIENT_FIELD = {
    schemaDoc: 'Billing account recipient. Should contain all meta information to identify the organization',
    type: Json,
    isRequired: true,
    extendGraphQLTypes: [RECIPIENT_GRAPHQL_TYPES],
    graphQLReturnType: BILLING_RECEIPT_RECIPIENT_FIELD_NAME,
    graphQLInputType: BILLING_RECEIPT_RECIPIENT_INPUT_NAME,
    graphQLAdminFragment: `{ ${RECIPIENT_QUERY_LIST} }`,
    hooks: {
        validateInput: validateRecipient,
    },
}

module.exports = {
    RECIPIENT_FIELD,
    RECIPIENT_QUERY_LIST,
}