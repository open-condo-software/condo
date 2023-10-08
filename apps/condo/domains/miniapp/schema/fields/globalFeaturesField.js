const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const { getValidator } = require('@condo/domains/common/schema/json.utils')
const { SUPPORTED_GLOBAL_FEATURES, GLOBAL_FEATURE_GRAPHQL_TYPE } = require('@condo/domains/miniapp/constants')

const GlobalFeaturesJsonSchema = {
    type: ['array', 'null'],
    items: { enum: SUPPORTED_GLOBAL_FEATURES },
    minItems: 1,
}

const ajv = new Ajv()
const GlobalFeaturesJsonValidator = ajv.compile(GlobalFeaturesJsonSchema)
const validateGlobalFeatures = getValidator(GlobalFeaturesJsonValidator)


const GLOBAL_FEATURES_GRAPHQL_TYPES = `
    enum ${GLOBAL_FEATURE_GRAPHQL_TYPE} {
        ${SUPPORTED_GLOBAL_FEATURES.join(' ')}
    }
`

const GLOBAL_FEATURES_FIELD = {
    schemaDoc: `List of features that this global mini-app implements. Can be one or more of the following: [${SUPPORTED_GLOBAL_FEATURES.join(', ')}]`,
    type: Json,
    isRequired: false,
    extendGraphQLTypes: GLOBAL_FEATURES_GRAPHQL_TYPES,
    graphQLInputType: `[${GLOBAL_FEATURE_GRAPHQL_TYPE}!]`,
    graphQLReturnType: `[${GLOBAL_FEATURE_GRAPHQL_TYPE}!]`,
    hooks: {
        validateInput: validateGlobalFeatures,
    },
}

module.exports = {
    GLOBAL_FEATURES_FIELD,
}
