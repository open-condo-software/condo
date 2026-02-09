const Ajv = require('ajv')

const {
    BILLING_RECEIPT_SERVICE_TO_PAY_DETAILS_FIELD_NAME,
    BILLING_RECEIPT_SERVICE_TO_PAY_DETAILS_INPUT_NAME,
    BILLING_RECEIPT_SERVICE_FIELD_NAME,
    BILLING_RECEIPT_SERVICE_INPUT_NAME,
    BILLING_RECEIPT_SERVICES_FIELD,
    BILLING_RECEIPT_SERVICES_INPUT,
} = require('@condo/domains/billing/constants/constants')
const { ToPayDetailsFields } = require('@condo/domains/billing/schema/fields/BillingReceipt/ToPayDetailsField')
const { render, getValidator } = require('@condo/domains/common/schema/json.utils')


const ServiceToPayDetailsFields = {
    ...ToPayDetailsFields,
    volume: 'String',
    tariff: 'String',
    measure: 'String',
}

const ServiceFields = {
    id: 'String',
    name: 'String!',
    toPay: 'String!',
    toPayDetails: BILLING_RECEIPT_SERVICE_TO_PAY_DETAILS_FIELD_NAME,
}
const ServiceInputs = {
    ...ServiceFields,
    toPayDetails: BILLING_RECEIPT_SERVICE_TO_PAY_DETAILS_INPUT_NAME,
}


const SERVICES_GRAPHQL_TYPES = `
    type ${BILLING_RECEIPT_SERVICE_TO_PAY_DETAILS_FIELD_NAME} {
        ${render(ServiceToPayDetailsFields)}
    }
    
    input ${BILLING_RECEIPT_SERVICE_TO_PAY_DETAILS_INPUT_NAME} {
        ${render(ServiceToPayDetailsFields)}
    }

    type ${BILLING_RECEIPT_SERVICE_FIELD_NAME} {
        ${render(ServiceFields)}
    }
    
    input ${BILLING_RECEIPT_SERVICE_INPUT_NAME} {
        ${render(ServiceInputs)}
    }
`

const ServiceToPayDetailsSchema = {
    type: ['object', 'null'],
    properties: Object.assign({},
        ...Object.keys(ServiceToPayDetailsFields).map((field) => ({ [field]: { type: ['string', 'null'] } })),
        { formula: { type: 'string' } },
    ),
}

const ServicesSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: ['string', 'null'] },
            name: { type: 'string' },
            toPay: { type: 'string' },
            toPayDetails: ServiceToPayDetailsSchema,
        },
        // todo(toplenboren) discuss the analytics and standartization service for services
        required: ['name', 'toPay'],
        additionalProperties: false,
    },
}

const ajv = new Ajv()
const ServicesSchemaValidator = ajv.compile(ServicesSchema)

const validateServices = getValidator(ServicesSchemaValidator)
const SERVICE_TO_PAY_DETAILS_QUERY_LIST = Object.keys(ServiceToPayDetailsFields).join(' ')
const SERVICES_QUERY_LIST = `${Object.keys(ServiceFields).join(' ')} { ${SERVICE_TO_PAY_DETAILS_QUERY_LIST} }`

const SERVICES_FIELD = {
    schemaDoc: 'Services to pay for. Every service has id, name and toPay. Service may or may not have toPay detail. Detail level 3 and 4',
    type: 'Json',
    sensitive: true,
    isRequired: false,
    extendGraphQLTypes: [SERVICES_GRAPHQL_TYPES],
    graphQLInputType: BILLING_RECEIPT_SERVICES_INPUT,
    graphQLReturnType: BILLING_RECEIPT_SERVICES_FIELD,
    graphQLAdminFragment: `{ ${SERVICES_QUERY_LIST} }`,
    hooks: {
        validateInput: validateServices,
    },
}

module.exports = {
    SERVICES_GRAPHQL_TYPES,
    SERVICES_FIELD,
    SERVICES_QUERY_LIST,
    ServicesSchema,
}
