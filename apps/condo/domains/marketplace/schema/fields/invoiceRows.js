const Ajv = require('ajv')
const { get, map, has } = require('lodash')

const { getByCondition } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { render, getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')
const { ERROR_INVALID_INVOICE_ROWS, DEFAULT_INVOICE_CURRENCY_CODE } = require('@condo/domains/marketplace/constants')
const { PRICE_MEASURES } = require('@condo/domains/marketplace/schema/fields/price')

const INVOICE_ROW_GQL_TYPE_NAME = 'InvoiceRowSchemaField'
const INVOICE_ROW_GQL_INPUT_NAME = 'InvoiceRowSchemaFieldInput'
const INVOICE_ROW_META_GQL_TYPE_NAME = 'InvoiceRowMetaSchemaField'
const INVOICE_ROW_META_GQL_INPUT_NAME = 'InvoiceRowMetaSchemaFieldInput'

const invoiceRowSchemaFields = {
    name: 'String!',
    toPay: 'String!',
    count: 'Int!',
    currencyCode: 'String',
    vatPercent: 'String',
    salesTaxPercent: 'String',
    sku: 'String',
    isMin: 'Boolean!',
    measure: 'String',
    meta: INVOICE_ROW_META_GQL_TYPE_NAME,
}

const invoiceRowMetaSchemaFields = {
    imageUrl: 'String',
    categoryBgColor: 'String',
}

const rowsGqlSchemaTypes = `
    type ${INVOICE_ROW_GQL_TYPE_NAME} {
        ${render(invoiceRowSchemaFields)}
    }
    
    input ${INVOICE_ROW_GQL_INPUT_NAME} {
        ${render({ ...invoiceRowSchemaFields, meta: INVOICE_ROW_META_GQL_INPUT_NAME })}
    }
    
    type ${INVOICE_ROW_META_GQL_TYPE_NAME} {
        ${render(invoiceRowMetaSchemaFields)}
    }
    
    input ${INVOICE_ROW_META_GQL_INPUT_NAME} {
        ${render(invoiceRowMetaSchemaFields)}
    }
`

const ajv = new Ajv()

const rowsFieldSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            toPay: { type: 'string' },
            count: { type: 'integer' },
            currencyCode: { type: 'string' },
            vatPercent: { type: 'string' },
            salesTaxPercent: { type: 'string' },
            sku: { type: 'string' },
            measure: { type: 'string', enum: Object.values(PRICE_MEASURES) },
            isMin: { type: 'boolean' },
            meta: {
                type: 'object',
                properties: {
                    imageUrl: { type: 'string' },
                    categoryBgColor: { type: 'string' },
                },
                additionalProperties: false,
            },
        },
        required: ['name', 'toPay', 'count', 'isMin'],
        additionalProperties: false,
    },
}

const validateRowsField = getGQLErrorValidator(ajv.compile(rowsFieldSchema), ERROR_INVALID_INVOICE_ROWS)

const metaFieldFragment = `meta { ${Object.keys(invoiceRowMetaSchemaFields).join(' ')} }`

const INVOICE_ROWS_FIELD = {
    schemaDoc: 'The list of paid items',
    type: 'Json',
    sensitive: true,
    isRequired: true,
    hooks: {
        resolveInput: async ({ operation, resolvedData, fieldPath, existingItem }) => {
            if (!has(resolvedData, fieldPath)) {
                return
            }

            /** @type {AcquiringIntegrationContext} */
            const acquiringContext = await getByCondition('AcquiringIntegrationContext', {
                organization: { id: get(operation === 'create' ? resolvedData : existingItem, 'organization') },
                deletedAt: null,
                invoiceStatus: CONTEXT_FINISHED_STATUS,
            })
            return map(get(resolvedData, fieldPath), (row) => ({
                currencyCode: DEFAULT_INVOICE_CURRENCY_CODE,
                vatPercent: get(acquiringContext, 'invoiceVatPercent', '') || '',
                salesTaxPercent: get(acquiringContext, 'invoiceSalesTaxPercent', '') || '',
                ...row,
            }))
        },
        validateInput: validateRowsField,
    },
    extendGraphQLTypes: [rowsGqlSchemaTypes],
    graphQLInputType: `[${INVOICE_ROW_GQL_INPUT_NAME}!]`,
    graphQLReturnType: `[${INVOICE_ROW_GQL_TYPE_NAME}!]!`,
    graphQLAdminFragment: `{ ${Object.keys(invoiceRowSchemaFields).map((field) => field === 'meta' ? metaFieldFragment : field).join(' ')} }`,
}

module.exports = { INVOICE_ROWS_FIELD }
