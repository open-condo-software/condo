const cuid = require('cuid')
const { get } = require('lodash')

const { normalizeQuery, normalizeVariables } = require('@open-condo/keystone/logging/normalize')

const { logger } = require('./utils')

/** @implements {import('apollo-server-plugin-base').ApolloServerPlugin} */
class ApolloMemMonPlugin {

    requestDidStart () {
        return {
            didResolveOperation: async (requestContext) => {
                const operationId = get(requestContext, 'operationId') || cuid()
                const { heapTotal, heapUsed } = process.memoryUsage()
                const operationName = get(requestContext,  'operationName')
                const query = normalizeQuery(get(requestContext, 'request.query'))
                const variables = normalizeVariables(get(requestContext, 'request.variables'))

                requestContext.operationId = operationId

                logger.info({ msg: 'beforeQuery', operationId, operationName, gql: { query, variables }, memoryUsage: { heapTotal, heapUsed } })
            },
            willSendResponse: async (requestContext) => {
                const { heapTotal, heapUsed } = process.memoryUsage()
                const operationName = get(requestContext,  'operationName')

                logger.info({ msg: 'afterQuery', operationId: requestContext.operationId, operationName, memoryUsage: { heapTotal, heapUsed } })
            },
        }
    }
}

module.exports = {
    ApolloMemMonPlugin,
}
