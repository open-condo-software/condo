const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const {
    BILLING_INTEGRATION_DATA_FORMAT_FIELD_NAME,
    BILLING_INTEGRATION_DATA_FORMAT_INPUT_NAME,
} = require('@condo/domains/billing/constants/constants')
const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const DataFormatFields = {
    hasToPayDetails: 'Boolean!',
    hasServices: 'Boolean!',
    hasServicesDetails: 'Boolean!',
}

const DATA_FORMAT_GQL_TYPES = `
    type ${BILLING_INTEGRATION_DATA_FORMAT_FIELD_NAME} {
        ${render(DataFormatFields)}
    }
    
    input ${BILLING_INTEGRATION_DATA_FORMAT_INPUT_NAME} {
        ${render(DataFormatFields)}
    }
`

const DATA_FORMAT_SCHEMA = {
    type: 'object',
    properties: {
        hasToPayDetails: { type: 'boolean' },    // True if billingReceipt has toPay detailing: e.g debt, recalculation fields
        hasServices: { type: 'boolean' },       // True if billingReceipt has services object: e.g cold water service
        hasServicesDetails: { type: 'boolean' }, // True if billingReceipt's services has detail: e.g debt and recalculation for cold water service
    },
    required: ['hasToPayDetails', 'hasServices', 'hasServicesDetails'],
    additionalProperties: false,
}

const ajv = new Ajv()
const DataFormatSchemaValidator = ajv.compile(DATA_FORMAT_SCHEMA)
const validateDataFormat = getValidator(DataFormatSchemaValidator)

const DATA_FORMAT_QUERY_LIST = Object.keys(DataFormatFields).join(' ')
const DATA_FORMAT_FIELD = {
    schemaDoc: 'Format of the data, that is output of this integration. This field specifies the detail and size of columns. If not specified we can only show first level of detail (address, account, toPay)',
    type: Json,
    isRequired: false,
    extendGraphQLTypes: [DATA_FORMAT_GQL_TYPES],
    graphQLInputType: BILLING_INTEGRATION_DATA_FORMAT_INPUT_NAME,
    graphQLReturnType: BILLING_INTEGRATION_DATA_FORMAT_FIELD_NAME,
    graphQLAdminFragment: `{ ${DATA_FORMAT_QUERY_LIST} }`,
    hooks: {
        validateInput: validateDataFormat,
    },
}

module.exports = {
    DATA_FORMAT_FIELD,
    DATA_FORMAT_SCHEMA,
    DATA_FORMAT_GQL_TYPES,
    DATA_FORMAT_QUERY_LIST,
}

