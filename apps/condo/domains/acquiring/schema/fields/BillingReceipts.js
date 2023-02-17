const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const {
    BILLING_RECEIPT_FIELD_NAME,
    BILLING_RECEIPT_INPUT_NAME,
    BILLING_RECEIPTS_SCHEMA_FIELD_NAME,
    BILLING_RECEIPTS_SCHEMA_INPUT_NAME,
} = require('@condo/domains/acquiring/constants/gql')
const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const BillingReceiptFields = {
    id: 'String!',
}

const BILLING_RECEIPT_GRAPHQL_TYPES = `
    type ${BILLING_RECEIPT_FIELD_NAME} {
        ${render(BillingReceiptFields)}
    }
    
    input ${BILLING_RECEIPT_INPUT_NAME} {
        ${render(BillingReceiptFields)}
    }
`

const BillingReceiptJsonSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
    },
    additionalProperties: false,
    required: ['id'],
}

const BillingReceiptsJsonSchema = {
    type: 'array',
    items: BillingReceiptJsonSchema,
}

const ajv = new Ajv()
const BillingReceiptsSchemaJsonValidator = ajv.compile(BillingReceiptsJsonSchema)
const validateBillingReceiptsSchema = getValidator(BillingReceiptsSchemaJsonValidator)
const BILLING_RECEIPT_QUERY_LIST = Object.keys(BillingReceiptFields).join(' ')

const BILLING_RECEIPTS_SCHEMA_FIELD = {
    schemaDoc: 'Contains information about the distribution of a certain type of fee',
    type: Json,
    isRequired: true,
    extendGraphQLTypes: [BILLING_RECEIPT_GRAPHQL_TYPES],
    graphQLInputType: BILLING_RECEIPTS_SCHEMA_INPUT_NAME,
    graphQLReturnType: BILLING_RECEIPTS_SCHEMA_FIELD_NAME,
    graphQLAdminFragment: `{ ${BILLING_RECEIPT_QUERY_LIST} }`,
    hooks: {
        validateInput: validateBillingReceiptsSchema,
    },
}

module.exports = {
    BILLING_RECEIPTS_SCHEMA_FIELD,
    BILLING_RECEIPT_QUERY_LIST,
}