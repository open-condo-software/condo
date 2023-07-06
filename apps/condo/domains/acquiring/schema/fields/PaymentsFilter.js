const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const PAYMENTS_FILTER_TYPE_NAME = 'PaymentsFilter'
const PAYMENTS_FILTER_INPUT_NAME = 'PaymentsFilterInput'

const PaymentsFilterFields = {
    advancedAt: '[String]',
    accountNumber: 'String',
    address: '[String]',
    type: '[String]',
    paymentTransaction: 'String',
    status: '[String]',
}

const PAYMENTS_FILTER_TYPE = `
    type ${PAYMENTS_FILTER_TYPE_NAME} {
        ${render(PaymentsFilterFields)}
    }
    
    input ${PAYMENTS_FILTER_INPUT_NAME} {
        ${render(PaymentsFilterFields)}
    }
`

const getPaymentsFilterSchemaValueType = (value) => value.startsWith('[') ? {
    type: 'array',
    items: { type: 'string' },
} : { type: 'string' }

const PaymentsFilterSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(PaymentsFilterFields).map((field) => ({ [field]: { ...getPaymentsFilterSchemaValueType(PaymentsFilterFields[field]) } })),
    ),
    additionalProperties: false,
}

const ajv = new Ajv()
const PaymentsFilterValidator = ajv.compile(PaymentsFilterSchema)
const validatePaymentsFilter = getValidator(PaymentsFilterValidator)

const PAYMENTS_FILTER_FIELD = {
    schemaDoc: 'Filter that match the given template',
    type: Json,
    extendGraphQLTypes: [PAYMENTS_FILTER_TYPE],
    graphQLReturnType: PAYMENTS_FILTER_TYPE_NAME,
    graphQLInputType: PAYMENTS_FILTER_INPUT_NAME,
    graphQLAdminFragment: `{ ${Object.keys(PaymentsFilterFields).join(' ')} }`,
    isRequired: true,
    hooks: {
        validateInput: validatePaymentsFilter,
    },
}

module.exports = {
    PAYMENTS_FILTER_FIELD,
}
