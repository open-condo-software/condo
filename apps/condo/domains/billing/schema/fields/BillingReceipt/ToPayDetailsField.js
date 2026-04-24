const Ajv = require('ajv')

const { BILLING_RECEIPT_TO_PAY_DETAILS_FIELD_NAME, BILLING_RECEIPT_TO_PAY_DETAILS_INPUT_NAME } = require('@condo/domains/billing/constants/constants')
const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const ToPayDetailsFields = {
    formula: 'String',
    charge: 'String',
    balance: 'String',
    recalculation: 'String',
    privilege: 'String',
    penalty: 'String',
    paid: 'String',
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
    required: [],
    additionalProperties: false,
}

const ajv = new Ajv()
const ToPayDetailsSchemaValidator = ajv.compile(ToPayDetailsSchema)

const TO_PAY_DETAILS_QUERY_LIST = Object.keys(ToPayDetailsFields).join(' ')

const validatePaymentDetails = getValidator(ToPayDetailsSchemaValidator)

/**
 * TODO(DOMA-6519): remove field and make all of the explicit fields available to write and update
 * Optional: provide backward compatibility for API to make available write and update explicit fields with old schema format. Example: { ..., toPayDetails: { formula: 'charge + penalty', paid: '200.08' } }
 */
const TO_PAY_DETAILS_FIELD = {
    schemaDoc: '@deprecated Sum to pay details. Detail level 2. ' +
        'This field will be removed in the future. ' +
        'All data is saved in the corresponding fields of the BillingReceipt (charge formula balance recalculation privilege penalty paid). ' +
        'After toPayDetails field removal you should update it content explicitly',
    type: 'Json',
    sensitive: true,
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
