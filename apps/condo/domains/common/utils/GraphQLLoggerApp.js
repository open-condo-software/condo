const { get, set } = require('lodash')
const cuid = require('cuid')
const ensureError = require('ensure-error')
const { serializeError } = require('serialize-error')
const falsey = require('falsey')
const pino = require('pino')
const serializers = require('pino-std-serializers')

const { safeFormatError } = require('./apolloErrorFormatter')

const HIDE_GRAPHQL_VARIABLES_KEYS = ['secret', 'password', 'data.password', 'data.secret']
const REQ_LOG_KEY = 'req'
const graphqlLogger = pino({
    name: 'graphql',
    enabled: falsey(process.env.DISABLE_LOGGING),
    serializers: {
        [REQ_LOG_KEY]: serializers.req,
    },
})

function normalizeQuery (string) {
    if (!string) return ''
    // NOTE(pahaz): https://spec.graphql.org/June2018/#sec-Insignificant-Commas
    //   Similar to white space and line terminators, commas (,) are used to improve the legibility of source text
    return string.replace(/[\s,]+/g, ' ').trim()
}

function normalizeVariables (object) {
    if (!object) return undefined
    const data = JSON.parse(JSON.stringify(object))
    for (const key of HIDE_GRAPHQL_VARIABLES_KEYS) {
        if (get(data, key)) {
            set(data, key, '***')
        }
    }
    return data
}

function getRequestLoggingContext (requestContext) {
    const reqId = get(requestContext, 'context.req.id')
    const authedItemId = get(requestContext, 'context.authedItem.id')
    const sessionId = get(requestContext, 'context.req.sessionID')
    const userId = get(requestContext, 'context.req.user.id')
    const url = get(requestContext, 'context.req.originalUrl')
    const ip = get(requestContext, 'context.req.ip')
    const req = get(requestContext, 'context.req')
    let user
    if (userId) {
        user = {
            id: userId,
            type: get(requestContext, 'context.req.user.type'),
            isAdmin: get(requestContext, 'context.req.user.isAdmin'),
            isSupport: get(requestContext, 'context.req.user.isSupport'),
        }
    }

    const operationId = get(requestContext, 'operationId')
    const operationName = get(requestContext, 'operationName')
    const queryHash = get(requestContext, 'queryHash')

    return { reqId, authedItemId, sessionId, user, operationId, operationName, queryHash, url, ip, [REQ_LOG_KEY]: req }
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

                const logData = getRequestLoggingContext(requestContext)
                const graphQLOperations = get(requestContext, 'document.definitions', []).map(
                    def => `${def.operation} ${def.name ? `${def.name.value} ` : ''}{ .. }`,
                )
                const query = normalizeQuery(get(requestContext, 'request.query'))
                const variables = JSON.stringify(normalizeVariables(get(requestContext, 'request.variables')))

                graphqlLogger.info({ graphQLOperations, gql: { query, variables }, ...logData })
            },

            /**
             * @param {import('apollo-server-types').GraphQLRequestContext} requestContext
             * @returns {Promise<void>}
             */
            async didEncounterErrors (requestContext) {
                const logData = getRequestLoggingContext(requestContext)
                const errors = get(requestContext, 'errors', [])

                try {
                    for (const error of errors) {
                        error.uid = get(error, 'uid') || get(error, 'originalError.uid') || cuid()
                        graphqlLogger.info({ apolloFormatError: safeFormatError(error), ...logData })
                    }
                } catch (formatErrorError) {
                    // NOTE(pahaz): Something went wrong with formatting above, so we log the errors
                    graphqlLogger.error({ formatErrorError: serializeError(ensureError(formatErrorError)), ...logData })
                    graphqlLogger.error({ serializedErrors: errors.map(error => serializeError(ensureError(error))), ...logData })
                }
            },
        }
    }
}

module.exports = {
    normalizeQuery,
    GraphQLLoggerPlugin,
}
