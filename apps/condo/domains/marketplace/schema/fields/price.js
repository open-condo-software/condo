const Ajv = require('ajv')

const { render, getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')
const { ERROR_INVALID_PRICE, VAT_OPTIONS } = require('@condo/domains/marketplace/constants')
const PRICE_GQL_TYPE_NAME = 'MarketItemPricePriceSchemaField'
const PRICE_GQL_INPUT_NAME = 'MarketItemPricePriceSchemaFieldInput'

const priceSchemaFields = {
    type: 'String!',
    group: 'String!',
    name: 'String!',
    price: 'String!',
    isMin: 'Boolean!',
    vatPercent: 'String',
    salesTaxPercent: 'String',
}

const priceGqlSchemaTypes = `
    type ${PRICE_GQL_TYPE_NAME} {
        ${render(priceSchemaFields)}
    }
    
    input ${PRICE_GQL_INPUT_NAME} {
        ${render(priceSchemaFields)}
    }
`

const PRICE_FIELD_SCHEMA = {
    type: 'array',
    items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'group', 'name', 'price', 'isMin'],
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
                pattern: '^-?[0-9]\\d*(\\.\\d+)?$',
            },
            isMin: {
                type: 'boolean',
            },
            vatPercent: {
                type: 'string',
                enum: VAT_OPTIONS.map(opt => opt.toString()),
            },
            salesTaxPercent: {
                type: 'string',
            },
        },
    },
}

const ajv = new Ajv()
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
    graphQLInputType: `[${PRICE_GQL_INPUT_NAME}!]`,
    graphQLReturnType: `[${PRICE_GQL_TYPE_NAME}!]!`,
    graphQLAdminFragment: `{ ${Object.keys(priceSchemaFields).join(' ')} }`,
}

module.exports = {
    PRICE_FIELD,
    PRICE_FIELD_SCHEMA,
}