const Ajv = require('ajv')
const { get, has, map } = require('lodash')

const { getByCondition, getById } = require('@open-condo/keystone/schema')

const { VAT_OPTIONS } = require('@condo/domains/acquiring/constants/context')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { render, getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')
const { ERROR_INVALID_PRICE } = require('@condo/domains/marketplace/constants')
const { DEFAULT_INVOICE_CURRENCY_CODE } = require('@condo/domains/marketplace/constants')
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
    currencyCode: 'String',
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
            currencyCode: {
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
        resolveInput: async ({ operation, resolvedData, fieldPath, existingItem }) => {
            if (!has(resolvedData, fieldPath)) {
                return
            }

            const marketItem = await getById('MarketItem', get(operation === 'create' ? resolvedData : existingItem, 'marketItem'))
            /** @type {AcquiringIntegrationContext} */
            const acquiringContext = await getByCondition('AcquiringIntegrationContext', {
                organization: { id: marketItem.organization },
                deletedAt: null,
                invoiceStatus: CONTEXT_FINISHED_STATUS,
            })
            return map(get(resolvedData, fieldPath), (row) => ({
                currencyCode: DEFAULT_INVOICE_CURRENCY_CODE,
                vatPercent: get(acquiringContext, 'invoiceVatPercent') || undefined,
                salesTaxPercent: get(acquiringContext, 'invoiceSalesTaxPercent', '') || '',
                ...row,
            }))
        },
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
