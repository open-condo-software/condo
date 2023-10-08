const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const {
    FEE_DISTRIBUTION_FIELD_NAME,
    FEE_DISTRIBUTION_INPUT_NAME,
    FEE_DISTRIBUTION_SCHEMA_FIELD_NAME,
    FEE_DISTRIBUTION_SCHEMA_INPUT_NAME,
} = require('@condo/domains/acquiring/constants/gql')
const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const FeeDistributionFields = {
    recipient: 'String!',
    percent: 'String!',
    minAmount: 'String',
    maxAmount: 'String',
    category: 'String',
}

const FEE_DISTRIBUTION_GRAPHQL_TYPES = `
    type ${FEE_DISTRIBUTION_FIELD_NAME} {
        ${render(FeeDistributionFields)}
    }
    
    input ${FEE_DISTRIBUTION_INPUT_NAME} {
        ${render(FeeDistributionFields)}
    }
`

const FeeDistributionJsonSchema = {
    type: 'object',
    properties: {
        recipient: { type: 'string' },
        percent: { type: 'string' },
        minAmount: { type: 'string' },
        maxAmount: { type: 'string' },
        category: { type: 'string' },
    },
    additionalProperties: false,
    required: ['recipient', 'percent'],
}

const FeeDistributionSchemaJsonSchema = {
    type: 'array',
    items: FeeDistributionJsonSchema,
}

const ajv = new Ajv()
const FeeDistributionSchemaJsonValidator = ajv.compile(FeeDistributionSchemaJsonSchema)
const validateFeeDistributionSchema = getValidator(FeeDistributionSchemaJsonValidator)
const FEE_DISTRIBUTION_QUERY_LIST = Object.keys(FeeDistributionFields).join(' ')

const FEE_DISTRIBUTION_SCHEMA_FIELD = {
    schemaDoc: 'Contains information about the distribution of a certain type of fee',
    type: Json,
    isRequired: true,
    extendGraphQLTypes: [FEE_DISTRIBUTION_GRAPHQL_TYPES],
    graphQLInputType: FEE_DISTRIBUTION_SCHEMA_INPUT_NAME,
    graphQLReturnType: FEE_DISTRIBUTION_SCHEMA_FIELD_NAME,
    graphQLAdminFragment: `{ ${FEE_DISTRIBUTION_QUERY_LIST} }`,
    hooks: {
        validateInput: validateFeeDistributionSchema,
    },
}

module.exports = {
    FEE_DISTRIBUTION_SCHEMA_FIELD,
    FEE_DISTRIBUTION_QUERY_LIST,
}
