const { getHeapStatistics } = require('node:v8')

const cuid = require('cuid')
const get = require('lodash/get')

const { getLogger } = require('./getLogger')
const { getReqLoggerContext } = require('./getReqLoggerContext')
const { normalizeQuery, normalizeVariables } = require('./normalize')

const { safeFormatError } = require('../apolloErrorFormatter')

const MiB = 1024 ** 2 // 1 MiB (mebibyte) = 1_048_576 B (byte)

const graphqlLogger = getLogger('graphql')
const graphqlErrorLogger = getLogger('graphqlerror')

// Note: Hard limit of the V8 heap (bytes). Fixed for the lifetime of the process.
//  Can be raised with the CLI flag `node --max-old-space-size=<MiB>` or via `NODE_OPTIONS="--max-old-space-size=<MiB>"` env
const { heap_size_limit: heapSizeLimitBytes } = getHeapStatistics()

function getHeapFree () {
    const { heapUsed } = process.memoryUsage()
    const freeBytes = Math.max(0, heapSizeLimitBytes - heapUsed)
    const freePct = Number((freeBytes / heapSizeLimitBytes * 100).toFixed(1))
    const freeMiB = Number((freeBytes / MiB).toFixed(2))
    return { freeMiB, freePct }
}

function getGraphQLReqLoggerContext (requestContext, { memory = false } = {}) {
    const req = get(requestContext, 'context.req')
    const reqContext = getReqLoggerContext(req)  // reqId, sessionId, user, ip, fingerprint, complexity
    const memoryContext = (memory) ? { mem: getHeapFree() } : {}

    const authedItemId = get(requestContext, 'context.authedItem.id')
    const operationId = get(requestContext, 'operationId')
    const operationName = get(requestContext, 'operationName')
    const queryHash = get(requestContext, 'queryHash')

    const graphQLOperations = get(requestContext, 'document.definitions', []).map(renderExecutableDefinitionNode).filter(Boolean)
    // TODO(pahaz): DOMA-11627 add normalization if length is more than 15_360
    const query = normalizeQuery(get(requestContext, 'request.query'))
    const variables = normalizeVariables(get(requestContext, 'request.variables'))

    return {
        graphQLOperations,
        gql: { query, variables, queryLength: query?.length, variablesLength: variables?.length },
        ...reqContext,
        ...memoryContext,
        authedItemId, operationId, operationName, queryHash,
        req,
    }
}

/**
 * @param node {require('graphql/language/ast').ExecutableDefinitionNode}
 */
function renderExecutableDefinitionNode (node) {
    if (!node) return ''
    if (node.kind === 'OperationDefinition') {
        return `${node.operation} ${node.name ? `${node.name.value}` : ''}`
    }
    return ''
}

/**
 * Get current time in nanoseconds and return diff between
 * @param time {bigint} start time of the operation
 * @returns {number} Operation elapsed time in milliseconds
 */
function timeFrom (time) {
    const diff = process.hrtime.bigint() - time

    return +(Number(diff) / 1000000).toFixed(4)
}

/**
 * @type {import('apollo-server-plugin-base').ApolloServerPlugin}
 */
class GraphQLLoggerPlugin {
    requestDidStart (requestContext) {
        let timeUntilExecution = null
        const requestStartTime = process.hrtime.bigint()
        graphqlLogger.info({
            state: 'requestDidStart',
            ...getGraphQLReqLoggerContext(requestContext, { memory: true }),
        })

        return {
            async responseForOperation (requestContext) {
                const operationId = get(requestContext, 'operationId') || cuid()
                // NOTE(pahaz): log correlation id for cases where not reqId
                requestContext.operationId = operationId
            },
            async executionDidStart () {
                timeUntilExecution = timeFrom(requestStartTime)
            },
            async willSendResponse (requestContext) {
                graphqlLogger.info({
                    state: 'willSendResponse',
                    ...getGraphQLReqLoggerContext(requestContext),
                    responseTime: timeFrom(requestStartTime),
                    timeUntilExecution,
                })
            },

            /**
             * @param {import('apollo-server-types').GraphQLRequestContext} requestContext
             * @returns {Promise<void>}
             */
            async didEncounterErrors (requestContext) {
                const logData = getGraphQLReqLoggerContext(requestContext)
                const errors = get(requestContext, 'errors', [])

                try {
                    for (const error of errors) {
                        error.uid = get(error, 'uid') || get(error, 'originalError.uid') || cuid()
                        graphqlErrorLogger.info({ apolloFormatError: safeFormatError(error), ...logData })
                    }
                } catch (err) {
                    // NOTE(pahaz): Something went wrong with formatting above, so we log the errors
                    graphqlErrorLogger.error({ msg: 'safeFormatError error', err, ...logData })
                }
            },
        }
    }
}

module.exports = {
    GraphQLLoggerPlugin,
    getGraphQLReqLoggerContext,
}
