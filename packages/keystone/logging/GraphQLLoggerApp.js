const cuid = require('cuid')
const ensureError = require('ensure-error')
const { get } = require('lodash')
const { serializeError } = require('serialize-error')

const { getLogger } = require('./getLogger')
const { getReqLoggerContext } = require('./getReqLoggerContext')
const { normalizeQuery, normalizeVariables } = require('./normalize')

const { safeFormatError } = require('../apolloErrorFormatter')

const graphqlLogger = getLogger('graphql')
const graphqlErrorLogger = getLogger('graphqlerror')

function getGraphQLReqLoggerContext (requestContext) {
    const req = get(requestContext, 'context.req')
    const reqContext = getReqLoggerContext(req)  // reqId, sessionId, user, ip, fingerprint

    const authedItemId = get(requestContext, 'context.authedItem.id')
    const operationId = get(requestContext, 'operationId')
    const operationName = get(requestContext, 'operationName')
    const queryHash = get(requestContext, 'queryHash')

    const graphQLOperations = get(requestContext, 'document.definitions', []).map(renderExecutableDefinitionNode).filter(Boolean)
    const query = normalizeQuery(get(requestContext, 'request.query'))
    const variables = normalizeVariables(get(requestContext, 'request.variables'))

    return { graphQLOperations, gql: { query, variables }, ...reqContext, authedItemId, operationId, operationName, queryHash, req }
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
 * @type {import('apollo-server-plugin-base').ApolloServerPlugin}
 */
class GraphQLLoggerPlugin {
    /**
     * @param { import('apollo-server-types').GraphQLRequestContext } requestContext
     * @returns {Promise<void>}
     */
    requestDidStart (requestContext) {
        return {
            /**
             * The responseForOperation event is fired immediately before GraphQL execution would take place.
             * If its return value resolves to a non-null GraphQLResponse, that result is used instead of executing the query.
             * Hooks from different plugins are invoked in series, and the first non-null response is used.
             * @param {import('apollo-server-types').WithRequired<import('apollo-server-types').GraphQLRequestContext<TContext>, 'metrics' | 'source' | 'document' | 'operationName' | 'operation' | 'logger'>} requestContext
             * @returns {Promise<import('apollo-server-types').GraphQLResponse | null>}
             */
            async responseForOperation (requestContext) {
                const operationId = get(requestContext, 'operationId') || cuid()
                // NOTE(pahaz): log correlation id for cases where not reqId
                requestContext.operationId = operationId

                const logData = getGraphQLReqLoggerContext(requestContext)
                graphqlLogger.info(logData)
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
                } catch (formatErrorError) {
                    // NOTE(pahaz): Something went wrong with formatting above, so we log the errors
                    graphqlErrorLogger.error({ formatErrorError: serializeError(ensureError(formatErrorError)), ...logData })
                    graphqlErrorLogger.error({ serializedErrors: errors.map(error => serializeError(ensureError(error))), ...logData })
                }
            },
        }
    }
}

module.exports = {
    GraphQLLoggerPlugin,
    getGraphQLReqLoggerContext,
}
