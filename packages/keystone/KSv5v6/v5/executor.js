const { execute } = require('graphql')

/**
 * Wraps basic executor like so:
 * https://github.com/apollographql/apollo-server/blob/apollo-server-core%402.26.0/packages/apollo-server-core/src/requestPipeline.ts#L565
 */
async function contextRequestExecutor (requestContext) {
    const executionArgs = {
        schema: requestContext.schema,
        document: requestContext.document,
        contextValue: requestContext.context,
        variableValues: requestContext.request.variables,
        operationName: requestContext.request.operationName,
    }

    // TODO: decompose this and add context wrapper
    return await execute(executionArgs)
}

module.exports = {
    contextRequestExecutor,
}