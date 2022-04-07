const { render } = require('@condo/domains/billing/schema/fields/utils/json.utils')
const { BILLING_RECEIPT_RECIPIENT_FIELD_NAME, BILLING_RECEIPT_RECIPIENT_INPUT_NAME } = require('@condo/domains/billing/constants/constants')
const { RECIPIENT_FIELDS_DEFINITION, RECIPIENT_FIELD: COMMON_RECIPIENT_FIELD, RECIPIENT_QUERY_LIST } = require('@condo/domains/common/schema/fields.js')

const RECIPIENT_GRAPHQL_TYPES = `
    type ${BILLING_RECEIPT_RECIPIENT_FIELD_NAME} {
        ${render(RECIPIENT_FIELDS_DEFINITION)}
    }
    
    input ${BILLING_RECEIPT_RECIPIENT_INPUT_NAME} {
        ${render(RECIPIENT_FIELDS_DEFINITION)}
    }
`

const RECIPIENT_FIELD = {
    schemaDoc: 'Billing account recipient. Should contain all meta information to identify the organization',
    ...COMMON_RECIPIENT_FIELD,
    extendGraphQLTypes: [RECIPIENT_GRAPHQL_TYPES],
    graphQLReturnType: BILLING_RECEIPT_RECIPIENT_FIELD_NAME,
    graphQLInputType: BILLING_RECEIPT_RECIPIENT_INPUT_NAME,
}

module.exports = {
    RECIPIENT_GRAPHQL_TYPES,
    RECIPIENT_FIELD,
    RECIPIENT_QUERY_LIST,
}
