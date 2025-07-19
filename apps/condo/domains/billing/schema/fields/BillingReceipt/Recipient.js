const { RECIPIENT_FIELDS_DEFINITION, RECIPIENT_FIELD: COMMON_RECIPIENT_FIELD, RECIPIENT_QUERY_LIST } = require('@condo/domains/acquiring/schema/fields/Recipient')
const { BILLING_RECEIPT_RECIPIENT_FIELD_NAME, BILLING_RECEIPT_RECIPIENT_INPUT_NAME } = require('@condo/domains/billing/constants/constants')
const { render } = require('@condo/domains/common/schema/json.utils')


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
