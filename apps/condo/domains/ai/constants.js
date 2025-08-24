const TASK_STATUSES = {
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
    CANCELLED: 'cancelled',
}

const FLOW_ADAPTERS = {
    FLOWISE: 'flowise',
}

const CUSTOM_FLOW_TYPE = 'custom_flow'
const TICKET_REWRITE_COMMENT_FLOW_TYPE = 'ticket_rewrite_comment_flow'
const REWRITE_TEXT_FLOW_TYPE = 'rewrite_text_flow'
const NEWS_REWRITE_TEXT_FLOW_TYPE = 'news_rewrite_text_flow'

/**
 * list of hardcoded flow types
 *
 * @example
 * EXAMPLE: 'example'
 */
const FLOW_TYPES = {
    TICKET_REWRITE_COMMENT_FLOW_TYPE: TICKET_REWRITE_COMMENT_FLOW_TYPE,
    REWRITE_TEXT_FLOW_TYPE: REWRITE_TEXT_FLOW_TYPE,
    NEWS_REWRITE_TEXT_FLOW_TYPE: NEWS_REWRITE_TEXT_FLOW_TYPE,
}
const FLOW_TYPES_LIST = Object.values(FLOW_TYPES)

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
    [TICKET_REWRITE_COMMENT_FLOW_TYPE]: {
        input: {
            type: 'object',
            properties: {
                comment: { type: 'string' },
                answer: { type: 'string' },

                ticketId: { type: 'string' },
                ticketDetails: { type: 'string' },
                ticketAddress: { type: 'string' },
                ticketStatusName: { type: 'string' },
                ticketLastComments: { type: 'string' },
                ticketUnitName: { type: 'string' },
                ticketUnitType: { type: 'string' },
                ticketFloorName: { type: 'string' },
                ticketSectionName: { type: 'string' },
                currentDateTime: { type: 'string' },
                actualIncidents: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            details: { type: 'string' },
                            textForResident: { type: 'string' },
                        },
                        additionalProperties: false,
                    },
                },
                isExecutorAssigned: { type: 'string' },
                isAssigneeAssigned: { type: 'string' },
            },
        },
        output: {
            type: 'object',
            properties: {
                answer: { type: 'string' },
            },
        },
    },
    REWRITE_TEXT_FLOW_TYPE: {
        input: {
            type: 'object',
            properties: {
                userInput: { type: 'string' },
            },
        },
        output: {
            type: 'object',
            properties: {
                answer: { type: 'string' },
            },
        },
    },
    [NEWS_REWRITE_TEXT_FLOW_TYPE]: {
        input: {
            type: 'object',
            properties: {
                promptType: { enum: ['title', 'body'] },
                title: { type: 'string' },
                body: { type: 'string' },
            },
        },
        output: {
            type: 'object',
            properties: {
                answer: { type: 'string' },
            },
        },
    },
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
        if (typeof schema !== 'object') throw new Error(`Flow "${flowName}" (${operation}): The meta schema must be an object!`)
        if (!('type' in schema)) throw new Error(`Flow "${flowName}" (${operation}): The meta schema must have a "type" field!`)
        if (schema.type !== 'object') throw new Error(`Flow "${flowName}" (${operation}): Field "type" in meta scheme must have value "object"!`)
    }
}

module.exports = {
    TASK_STATUSES,
    FLOW_TYPES,
    FLOW_TYPES_LIST,
    FLOW_META_SCHEMAS,
    CUSTOM_FLOW_TYPE,
    FLOW_ADAPTERS,
}
