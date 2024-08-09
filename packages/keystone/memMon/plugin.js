const cuid = require('cuid')
const { get } = require('lodash')

const { logger } = require('./utils')

/** @implements {import('apollo-server-plugin-base').ApolloServerPlugin} */
class ApolloMemMonPlugin {

    requestDidStart () {
        return {
            didResolveOperation: async (requestContext) => {
                const operationId = get(requestContext, 'operationId') || cuid()
                const mem = process.memoryUsage()
                const operationName = get(requestContext, ['request', 'operationName'])

                requestContext.operationId = operationId

                logger.info({ msg: 'beforeQuery', operationId, operationName, data: { mem } })
            },
            willSendResponse: async (requestContext) => {
                const mem = process.memoryUsage()
                const operationName = get(requestContext, ['request', 'operationName'])

                logger.info({ msg: 'afterQuery', operationId: requestContext.operationId, operationName, data: { mem } })
            },
        }
    }
}

module.exports = {
    ApolloMemMonPlugin,
}
