const { z } = require('zod')

const { getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')
const { NATIVE_APP_FEATURE_GRAPHQL_TYPE, SUPPORTED_NATIVE_APP_FEATURES, INVALID_NATIVE_APP_FEATURES_ERROR } = require('@condo/domains/miniapp/constants')

const APP_FEATURES_GRAPHQL_TYPES = `
    enum ${NATIVE_APP_FEATURE_GRAPHQL_TYPE} {
        ${SUPPORTED_NATIVE_APP_FEATURES.join(' ')}
    }
`

const NATIVE_APP_FEATURES_FIELD = {
    schemaDoc: `List of native resident app features that this B2C app can replace. Can be one or more of the following: [${SUPPORTED_NATIVE_APP_FEATURES.join(', ')}]`,
    type: 'Json',
    isRequired: false,
    extendGraphQLTypes: APP_FEATURES_GRAPHQL_TYPES,
    graphQLInputType: `[${NATIVE_APP_FEATURE_GRAPHQL_TYPE}!]`,
    graphQLReturnType: `[${NATIVE_APP_FEATURE_GRAPHQL_TYPE}!]`,
    hooks: {
        validateInput: getGQLErrorValidator(
            z.array(z.enum(SUPPORTED_NATIVE_APP_FEATURES)).min(1).nullable(),
            INVALID_NATIVE_APP_FEATURES_ERROR
        ),
    },
}

module.exports = {
    NATIVE_APP_FEATURES_FIELD,
}
