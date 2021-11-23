const {
    AvailableOptionFields,
    AvailableOptionInputs,
    AvailableOptionSchema,
} = require('@condo/domains/billing/schema/fields/BillingIntegration/AvailableOptions')
const {
    BILLING_CONTEXT_INTEGRATION_OPTION_FIELD_NAME,
    BILLING_CONTEXT_INTEGRATION_OPTION_INPUT_NAME,
} = require('@condo/domains/billing/constants/constants')
const omit = require('lodash/omit')
const Ajv = require('ajv')
const { Json } = require('@core/keystone/fields')
const { render, getValidator } = require('@condo/domains/billing/schema/fields/utils/json.utils')

const OptionFields = omit(AvailableOptionFields, 'descriptionDetails')
const OptionInputs = omit(AvailableOptionInputs, 'descriptionDetails')

const OPTION_GRAPHQL_TYPES = `
    type ${BILLING_CONTEXT_INTEGRATION_OPTION_FIELD_NAME} {
        ${render(OptionFields)}
    }
    
    input ${BILLING_CONTEXT_INTEGRATION_OPTION_INPUT_NAME} {
        ${render(OptionInputs)}
    }
`

const OptionSchema = {
    ...AvailableOptionSchema,
    properties: omit(AvailableOptionSchema.properties, 'descriptionDetails'),
}

const ajv = new Ajv()
const OptionSchemaValidator = ajv.compile(OptionSchema)
const validateIntegrationOption = getValidator(OptionSchemaValidator)
const INTEGRATION_OPTION_QUERY_LIST = Object.keys(AvailableOptionFields).join(' ')

const INTEGRATION_OPTION_FIELD = {
    schemaDoc: 'Option of billing integration, if it has more than 1 variants. Example: registry format. Using "name" as identifier inside single billing',
    isRequired: false,
    type: Json,
    extendGraphQLTypes: OPTION_GRAPHQL_TYPES,
    graphQLInputType: BILLING_CONTEXT_INTEGRATION_OPTION_INPUT_NAME,
    graphQLReturnType: BILLING_CONTEXT_INTEGRATION_OPTION_FIELD_NAME,
    graphQLAdminFragment: `{ ${INTEGRATION_OPTION_QUERY_LIST} }`,
    hooks: {
        validateInput: validateIntegrationOption,
    },
}

module.exports = {
    INTEGRATION_OPTION_FIELD,
}


