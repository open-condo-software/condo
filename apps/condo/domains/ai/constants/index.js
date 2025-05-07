const conf = require('@open-condo/config')


const TASK_STATUSES = {
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
    CANCELLED: 'cancelled',
}

const FLOW_ADAPTERS = {
    FLOWISE: 'flowise',
}

/**
 *
 * @example
 * {
 *     default: {
 *         example: {
 *             adapter: 'flowise',
 *             predictionUrl: 'http://localhost:3000/api/v1/prediction/ed7891c2-19bf-4651-b96a-cdf169ea3dd8',
 *         },
 *     },
 *     custom: {
 *         my_custom_flow: {
 *             adapter: 'flowise',
 *             predictionUrl: 'http://localhost:3000/api/v1/prediction/ed7891c2-19bf-4651-b96a-cdf169ea3dd8',
 *         },
 *     },
 * }
 */
const AI_FLOWS_CONFIG = conf.AI_FLOWS_CONFIG ? JSON.parse(conf.AI_FLOWS_CONFIG) : {}

const CUSTOM_FLOW_TYPE = 'custom_flow'

/**
 * list of hardcoded flow types
 *
 * @example
 * EXAMPLE: 'example'
 */
const FLOW_TYPES = {
}
const FLOW_TYPES_LIST = Object.values(FLOW_TYPES)

const CUSTOM_FLOW_TYPES_LIST = Object.keys(AI_FLOWS_CONFIG?.custom || {})

/**
 * Schemes for validating input and output data.
 * Syntax Ajv. Only object type.
 * If a schema is not specified for a type, the basic check will be used: { type: 'object' }
 *
 * @example
 * [FLOW_TYPES.EXAMPLE]: {
 *         input: {
 *             type: 'object',
 *             properties: {
 *                 problem: {
 *                     type: 'string',
 *                 },
 *             },
 *             additionalProperties: false,
 *             required: ['problem'],
 *         },
 *         output: {
 *             type: 'object',
 *             properties: {
 *                 answer: {
 *                     type: 'string',
 *                 },
 *             },
 *             additionalProperties: false,
 *             required: ['answer'],
 *         },
 *     },
 */
const FLOW_META_SCHEMAS = {
    [CUSTOM_FLOW_TYPE]: {
        // Data for custom flows is only checked to ensure that it is an object
        input: {
            type: 'object',
        },
        output: {
            type: 'object',
        },
    },
}

for (const [flowName, schemaByOperation] of Object.entries(FLOW_META_SCHEMAS)) {
    for (const [operation, schema] of Object.entries(schemaByOperation)) {
        if (operation !== 'input' && operation !== 'output') throw new Error(`Flow "${flowName}": You can only specify the properties "input" and "output"!`)
        if (typeof schema !== 'object') throw new Error(`Flow "${flowName}" (${operation}): The meta schema must be object!`)
        if (!('type' in schema)) throw new Error(`Flow "${flowName}" (${operation}): The meta schema must have a "type" field!`)
        if (schema.type !== 'object') throw new Error(`Flow "${flowName}" (${operation}): Field "type" in meta scheme must have value "object"!`)
    }
}


module.exports = {
    TASK_STATUSES,
    FLOW_TYPES,
    FLOW_TYPES_LIST,
    CUSTOM_FLOW_TYPES_LIST,
    FLOW_META_SCHEMAS,
    CUSTOM_FLOW_TYPE,
    FLOW_ADAPTERS,
    AI_FLOWS_CONFIG,
}
