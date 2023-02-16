const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const {
    SETTINGS_FIELD_NAME,
    SETTINGS_INPUT_NAME,
} = require('@condo/domains/acquiring/constants/gql')
const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const SettingsFields = {
    cardId: 'String!',
}

const SETTINGS_GRAPHQL_TYPES = `
    type ${SETTINGS_FIELD_NAME} {
        ${render(SettingsFields)}
    }
    
    input ${SETTINGS_INPUT_NAME} {
        ${render(SettingsFields)}
    }
`

const SettingsJsonSchema = {
    type: 'object',
    properties: {
        cardId: { type: 'string' },
    },
    additionalProperties: false,
    required: ['cardId'],
}

const ajv = new Ajv()

const SETTINGS_FIELD = {
    schemaDoc: 'Settings. Should contain recurrent payment context configuration.',
    type: Json,
    isRequired: true,
    graphQLAdminFragment: `{ ${Object.keys(SettingsFields).join(' ')} }`,
    extendGraphQLTypes: [SETTINGS_GRAPHQL_TYPES],
    graphQLReturnType: SETTINGS_FIELD_NAME,
    graphQLInputType: SETTINGS_INPUT_NAME,
    hooks: {
        validateInput: getValidator(ajv.compile(SettingsJsonSchema)),
    },
}

module.exports = {
    SETTINGS_FIELD,
}
