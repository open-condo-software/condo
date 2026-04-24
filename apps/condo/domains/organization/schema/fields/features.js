const Ajv = require('ajv')

const access = require('@open-condo/keystone/access')

const { getValidator } = require('@condo/domains/common/schema/json.utils')
const { ALL_FEATURES, ORGANIZATION_FEATURE_ENUM_NAME } = require('@condo/domains/organization/constants/features')

const OrganizationFeaturesJSONSchema = {
    'type': 'array',
    'items': {
        'type': 'string',
        'enum': ALL_FEATURES,
    },
}

const ORGANIZATION_FEATURES_GRAPHQL_TYPES = `
    enum ${ORGANIZATION_FEATURE_ENUM_NAME} { ${ALL_FEATURES.join(' ')} }
`

const ajv = new Ajv()
const OrganizationFeaturesJSONValidator = ajv.compile(OrganizationFeaturesJSONSchema)
const validateFeatures = getValidator(OrganizationFeaturesJSONValidator)

const ORGANIZATION_FEATURES_FIELD = {
    schemaDoc: 'List of the organization\'s features connected by a particular integration',
    type: 'Json',
    isRequired: true,
    extendGraphQLTypes: [ORGANIZATION_FEATURES_GRAPHQL_TYPES],
    graphQLInputType: `[${ORGANIZATION_FEATURE_ENUM_NAME}!]`,
    graphQLReturnType: `[${ORGANIZATION_FEATURE_ENUM_NAME}!]!`,
    hooks: {
        validateInput: validateFeatures,
    },
    defaultValue: [],
    access: {
        create: access.userIsAdminOrIsSupport,
        read: true,
    },
}

module.exports = {
    ORGANIZATION_FEATURES_FIELD,
}
