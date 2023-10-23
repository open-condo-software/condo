const Ajv = require('ajv')

const { render, getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')
const { ERROR_INVALID_MOBILE_SETTINGS } = require('@condo/domains/marketplace/constants')
const MOBILE_SETTINGS_GQL_INPUT_NAME = 'MobileSettingsSchemaField'
const MOBILE_SETTINGS_GQL_TYPE_NAME = 'MobileSettingsSchemaFieldInput'

const mobileSettingsSchemaFields = {
    bgColor: 'String!',
    titleColor: 'String!',
}

const priceGqlSchemaTypes = `
    type ${MOBILE_SETTINGS_GQL_TYPE_NAME} {
        ${render(mobileSettingsSchemaFields)}
    }
    
    input ${MOBILE_SETTINGS_GQL_INPUT_NAME} {
        ${render(mobileSettingsSchemaFields)}
    }
`

const SETTINGS_FIELD_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['bgColor', 'titleColor'],
    properties: {
        bgColor: {
            type: 'string',
            pattern: '^#(?:[0-9a-fA-F]{3}){1,2}$',
        },
        titleColor: {
            type: 'string',
            pattern: '^#(?:[0-9a-fA-F]{3}){1,2}$',
        },
    },
}

const ajv = new Ajv()
const validateSettingsField = getGQLErrorValidator(ajv.compile(SETTINGS_FIELD_SCHEMA), ERROR_INVALID_MOBILE_SETTINGS)

const MOBILE_SETTINGS_FIELD = {
    schemaDoc: 'Settings for mobile ui',
    type: 'Json',
    isRequired: true,
    hooks: {
        validateInput: validateSettingsField,
    },
    extendGraphQLTypes: priceGqlSchemaTypes,
    graphQLInputType: `${MOBILE_SETTINGS_GQL_INPUT_NAME}`,
    graphQLReturnType: `${MOBILE_SETTINGS_GQL_TYPE_NAME}`,
    graphQLAdminFragment: `{ ${Object.keys(mobileSettingsSchemaFields).join(' ')} }`,
}

module.exports = {
    MOBILE_SETTINGS_FIELD,
    SETTINGS_FIELD_SCHEMA,
}