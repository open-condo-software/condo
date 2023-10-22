const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const { render, getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')
const { ERROR_INVALID_PRICE } = require('@condo/domains/marketplace/constants')
const PRICE_GQL_TYPE_NAME = 'PriceSchemaField'
const PRICE_GQL_INPUT_NAME = 'PriceSchemaFieldInput'

const priceSchemaFields = {
    type: 'String!',
    group: 'String!',
    name: 'String!',
    price: 'String!',
    isMin: 'Boolean!',
    vat: 'String!',
    salesTax: 'String!',
}

const priceGqlSchemaTypes = `
    type ${PRICE_GQL_TYPE_NAME} {
        ${render(priceSchemaFields)}
    }
    
    input ${PRICE_GQL_INPUT_NAME} {
        ${render(priceSchemaFields)}
    }
`

const taxOptions = ['null', '0', '10', '20']
const PRICE_FIELD_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'group', 'name', 'price', 'isMin', 'vat', 'salesTax'],
    properties: {
        type: {
            type: 'string',
            enum: ['variant', 'extra'],
        },
        group: {
            type: 'string',
        },
        name: {
            type: 'string',
        },
        price: {
            type: 'string',
            pattern: '^[0-9]+$',
        },
        isMin: {
            type: 'boolean',
        },
        vat: {
            type: 'string',
            enum: taxOptions,
        },
        salesTax: {
            type: 'string',
            enum: taxOptions,
        },
    },
}

const ajv = new Ajv()
addFormats(ajv)
const validatePriceField = getGQLErrorValidator(ajv.compile(PRICE_FIELD_SCHEMA), ERROR_INVALID_PRICE)

const PRICE_FIELD = {
    schemaDoc: 'The price field contains information about options (type=variant) and additional services (type=extra). ' +
        'Options are grouped by the group field and offer the choice of one option from the group. ' +
        'Extras are not grouped in any way and can be selected independently. ' +
        'The price may not be final but minimum. To do this, we use the isMin field.',
    type: 'Json',
    isRequired: true,
    hooks: {
        validateInput: validatePriceField,
    },
    extendGraphQLTypes: priceGqlSchemaTypes,
    graphQLInputType: `${PRICE_GQL_INPUT_NAME}`,
    graphQLReturnType: `${PRICE_GQL_TYPE_NAME}`,
    graphQLAdminFragment: `{ ${Object.keys(priceSchemaFields).join(' ')} }`,
}

module.exports = {
    PRICE_FIELD,
    PRICE_FIELD_SCHEMA,
}