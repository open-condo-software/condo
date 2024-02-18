const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')

const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const RECIPIENT_FIELDS_DEFINITION = {
    name: 'String',
    bankName: 'String',
    territoryCode: 'String',
    offsettingAccount: 'String',
    tin: 'String!',
    iec: 'String',
    bic: 'String!',
    bankAccount: 'String!',
    classificationCode: 'String',
}

const RECIPIENT_FIELD_NAME = 'RecipientField'
const RECIPIENT_INPUT_NAME = 'RecipientFieldInput'

const ajv = new Ajv()

const RecipientSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(RECIPIENT_FIELDS_DEFINITION).map((field) => ({ [field]: { type: 'string' } })),
    ),
    required: Object.keys(RECIPIENT_FIELDS_DEFINITION).filter(fieldName => RECIPIENT_FIELDS_DEFINITION[fieldName].slice(-1) === '!'),
    additionalProperties: false,
}

const RECIPIENT_GRAPHQL_TYPES = `
    type ${RECIPIENT_FIELD_NAME} {
        ${render(RECIPIENT_FIELDS_DEFINITION)}
    }
    
    input ${RECIPIENT_INPUT_NAME} {
        ${render(RECIPIENT_FIELDS_DEFINITION)}
    }
`

const RECIPIENT_FIELD = {
    schemaDoc: 'Recipient. Should contain all meta information to identify the organization',
    type: Json,
    isRequired: true,
    graphQLAdminFragment: `{ ${Object.keys(RECIPIENT_FIELDS_DEFINITION).join(' ')} }`,
    extendGraphQLTypes: [RECIPIENT_GRAPHQL_TYPES],
    graphQLReturnType: RECIPIENT_FIELD_NAME,
    graphQLInputType: RECIPIENT_INPUT_NAME,
    hooks: {
        validateInput: getValidator(ajv.compile(RecipientSchema)),
    },
}


module.exports = {
    RECIPIENT_FIELD,
    RECIPIENT_FIELDS_DEFINITION,
}
