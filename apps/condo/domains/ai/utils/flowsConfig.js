const conf = require('@open-condo/config')

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
 *             adapter: 'n8n',
 *             predictionUrl: 'http://localhost:3000/api/v1/prediction/ed7891c2-19bf-4651-b96a-cdf169ea3dd8',
 *         },
 *     },
 * }
 */
const AI_FLOWS_CONFIG = conf.AI_FLOWS_CONFIG ? JSON.parse(conf.AI_FLOWS_CONFIG) : {}

const CUSTOM_FLOW_TYPES_LIST = Object.keys(AI_FLOWS_CONFIG?.custom || {})

module.exports = {
    AI_FLOWS_CONFIG,
    CUSTOM_FLOW_TYPES_LIST,
}