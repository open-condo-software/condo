const Ajv = require('ajv')
const {
    BILLING_INTEGRATION_OPTIONS_FIELD_NAME,
    BILLING_INTEGRATION_OPTIONS_INPUT_NAME,
    BILLING_INTEGRATION_OPTION_FIELD_NAME,
    BILLING_INTEGRATION_OPTION_INPUT_NAME,
    BILLING_INTEGRATION_OPTION_DETAILS_FIELD_NAME,
    BILLING_INTEGRATION_OPTION_DETAILS_INPUT_NAME,
} = require('@condo/domains/billing/constants')
const { render, getValidator } = require('@condo/domains/billing/schema/fields/utils/json.utils')
const { Json } = require('@core/keystone/fields')

const AvailableOptionDetailsFields = {
    detailsText: 'String!',
    detailsLink: 'String!',
}

const AvailableOptionFields = {
    name: 'String!',
    billingPageTitle: 'String',
    details: BILLING_INTEGRATION_OPTION_DETAILS_FIELD_NAME,
}

const AvailableOptionInputs = {
    ...AvailableOptionFields,
    details: BILLING_INTEGRATION_OPTION_DETAILS_INPUT_NAME,
}

const AvailableOptionsFields = {
    title: 'String!',
    options: `[${BILLING_INTEGRATION_OPTION_FIELD_NAME}!]!`,
}

const AvailableOptionsInputs = {
    title: 'String!',
    options: `[${BILLING_INTEGRATION_OPTION_INPUT_NAME}!]!`,
}

const AVAILABLE_OPTIONS_GRAPHQL_TYPES = `
    type ${BILLING_INTEGRATION_OPTION_DETAILS_FIELD_NAME} {
        ${render(AvailableOptionDetailsFields)}    
    }
    
    input ${BILLING_INTEGRATION_OPTION_DETAILS_INPUT_NAME} {
        ${render(AvailableOptionDetailsFields)}
    }
    
    type ${BILLING_INTEGRATION_OPTION_FIELD_NAME} {
        ${render(AvailableOptionFields)}
    }
    
    input ${BILLING_INTEGRATION_OPTION_INPUT_NAME} {
        ${render(AvailableOptionInputs)}
    }
    
    type ${BILLING_INTEGRATION_OPTIONS_FIELD_NAME} {
        ${render(AvailableOptionsFields)}
    }
    
    input ${BILLING_INTEGRATION_OPTIONS_INPUT_NAME} {
        ${render(AvailableOptionsInputs)}
    }
`

const AvailableOptionsSchema = {
    type: 'object',
    properties: {
        title: { type: 'string' },
        options: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    billingPageTitle: { type: 'string' },
                    details: {
                        type: 'object',
                        properties: {
                            detailsText: { type: 'string' },
                            detailsLink: { type: 'string' },
                        },
                        required: ['detailsText', 'detailsLink'],
                        additionalProperties: false,
                    },
                },
                required: ['name'],
                additionalProperties: false,
            },
        },
    },
    required: ['title', 'options'],
    additionalProperties: false,
}

const ajv = new Ajv()
const AvailableOptionsSchemaValidator = ajv.compile(AvailableOptionsSchema)
const validateAvailableOptions = getValidator(AvailableOptionsSchemaValidator)
const AVAILABLE_OPTIONS_QUERY_LIST = 'title options { name billingPageTitle details { detailsText detailsLink } }'

const AVAILABLE_OPTIONS_FIELD = {
    schemaDoc: 'List of available billing options. If it exists, it means that several options are available for connecting billing',
    type: Json,
    isRequired: false,
    extendGraphQLTypes: [AVAILABLE_OPTIONS_GRAPHQL_TYPES],
    graphQLInputType: BILLING_INTEGRATION_OPTIONS_INPUT_NAME,
    graphQLReturnType: BILLING_INTEGRATION_OPTIONS_FIELD_NAME,
    graphQLAdminFragment: `{ ${AVAILABLE_OPTIONS_QUERY_LIST} }`,
    hooks: {
        validateInput: validateAvailableOptions,
    },
}

module.exports = {
    AVAILABLE_OPTIONS_FIELD,
}

