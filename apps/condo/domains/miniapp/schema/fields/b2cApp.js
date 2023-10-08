const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const { render, getValidator } = require('@condo/domains/common/schema/json.utils')
const { B2C_APP_COLOR_SCHEMA_TYPE_NAME, B2C_APP_COLOR_SCHEMA_INPUT_NAME } = require('@condo/domains/miniapp/constants')

const colorsSchemaFields = {
    main: 'String!',
    secondary: 'String!',
}

const colorSchemaGraphQLTypes = `
    type ${B2C_APP_COLOR_SCHEMA_TYPE_NAME} {
        ${render(colorsSchemaFields)}
    }
    
    input ${B2C_APP_COLOR_SCHEMA_INPUT_NAME} {
        ${render(colorsSchemaFields)}
    }
`

const colorSchemaJSONSchema = {
    type: 'object',
    properties: {
        main: {
            type: 'string',
            pattern: '^#([0-9A-Fa-f]{3}){1,2}$',
        },
        secondary: {
            type: 'string',
            pattern: '^#([0-9A-Fa-f]{3}){1,2}$',
        },
    },
    required: ['main', 'secondary'],
    additionalProperties: false,
}

const ajv = new Ajv()
const colorSchemaCompiledSchema = ajv.compile(colorSchemaJSONSchema)
const colorSchemaQueryList = Object.keys(colorsSchemaFields).join(' ')
const colorSchemaValidator = getValidator(colorSchemaCompiledSchema)

const COLOR_SCHEMA_FIELD = {
    schemaDoc: 'The color schema of the B2C application used to display it correctly. The main color is used for texts, icons etc. The secondary color is used for the background',
    type: Json,
    extendGraphQLTypes: [colorSchemaGraphQLTypes],
    graphQLInputType: B2C_APP_COLOR_SCHEMA_INPUT_NAME,
    graphQLReturnType: B2C_APP_COLOR_SCHEMA_TYPE_NAME,
    graphQLAdminFragment: `{ ${colorSchemaQueryList} }`,
    isRequired: true,
    hooks: {
        validateInput: colorSchemaValidator,
    },
}

module.exports = {
    COLOR_SCHEMA_FIELD,
}