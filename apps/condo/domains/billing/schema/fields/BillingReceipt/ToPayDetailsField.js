const Ajv = require('ajv')
const { render, getValidator } = require('@condo/domains/common/schema/json.utils')
const { BILLING_RECEIPT_TO_PAY_DETAILS_FIELD_NAME, BILLING_RECEIPT_TO_PAY_DETAILS_INPUT_NAME } = require('@condo/domains/billing/constants/constants')
const { Json } = require('@core/keystone/fields')

const ToPayDetailsFields = {
    formula: 'String!',
    charge: 'String',
    balance: 'String',
    recalculation: 'String',
    privilege: 'String',
    penalty: 'String',
}

const TO_PAY_DETAILS_GRAPHQL_TYPES = `
    type ${BILLING_RECEIPT_TO_PAY_DETAILS_FIELD_NAME} {
        ${render(ToPayDetailsFields)}
    }
    
    input ${BILLING_RECEIPT_TO_PAY_DETAILS_INPUT_NAME} {
        ${render(ToPayDetailsFields)}
    }
`

const ToPayDetailsSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(ToPayDetailsFields).map((field) => ({ [field]: { 'type': ['string', 'null'] } })),
        { formula: { type: 'string' } }
    ),
    required: ['formula'],
    additionalProperties: false,
}

const ajv = new Ajv()
const ToPayDetailsSchemaValidator = ajv.compile(ToPayDetailsSchema)

const TO_PAY_DETAILS_QUERY_LIST = Object.keys(ToPayDetailsFields).join(' ')

const validatePaymentDetails = getValidator(ToPayDetailsSchemaValidator)

const TO_PAY_DETAILS_FIELD = {
    schemaDoc: 'Sum to pay details. Detail level 2',
    type: Json,
    extendGraphQLTypes: [TO_PAY_DETAILS_GRAPHQL_TYPES],
    graphQLInputType: BILLING_RECEIPT_TO_PAY_DETAILS_INPUT_NAME,
    graphQLReturnType: BILLING_RECEIPT_TO_PAY_DETAILS_FIELD_NAME,
    graphQLAdminFragment: `{ ${TO_PAY_DETAILS_QUERY_LIST} }`,
    isRequired: false,
    hooks: {
        validateInput: validatePaymentDetails,
    },
}

module.exports = {
    TO_PAY_DETAILS_GRAPHQL_TYPES,
    TO_PAY_DETAILS_FIELD,
    TO_PAY_DETAILS_QUERY_LIST,
    ToPayDetailsFields,
    ToPayDetailsSchema,
}
