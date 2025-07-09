const path = require('path')

const { getExecutionContext } = require('@open-condo/keystone/executionContext')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')

function _isApp (pathParts) {
    return Array.isArray(pathParts) && pathParts.length > 1 && pathParts[0] === 'apps'
}

function _isPackage (pathParts) {
    return Array.isArray(pathParts) && pathParts.length > 1 && pathParts[0] === 'packages'
}

function _isInDomain (pathParts) {
    return _isApp(pathParts) && pathParts.length > 3 && pathParts[2] === 'domains'
}

function _isInTasks (pathParts) {
    return _isInDomain(pathParts) && pathParts.length > 5 && pathParts[4] === 'tasks'
}

function extractPropertiesFromPath (loggerUnixPath) {
    const pathParts = loggerUnixPath.split('/')
    const properties = {}

    // Extract package name
    if (_isApp(pathParts) || _isPackage(pathParts)) {
        properties['package'] = pathParts[1]
    }

    // Extract domain name
    if (_isInDomain(pathParts)) {
        properties['domain'] = pathParts[3]
    }

    // Extract task name if possible
    if (_isInTasks(pathParts)) {
        const fileOrDirName = path.parse(pathParts[5]).name
        if (fileOrDirName !== 'index') {
            properties['taskName'] = fileOrDirName
        }
    }

    return properties
}

function enhanceLogWithAsyncContext (dataObj) {
    const enhancedObj = { ...dataObj }

    // Execution context
    const executionContext = getExecutionContext()
    if (executionContext?.reqId) {
        enhancedObj['reqId'] = executionContext.reqId
    }
    if (executionContext?.taskId) {
        enhancedObj['taskId'] = executionContext.taskId
    }

    // Graphql context
    const gqlContext = graphqlCtx.getStore()
    if (gqlContext?.gqlOperationName) {
        enhancedObj['gqlOperationName'] = gqlContext.gqlOperationName
    }

    return enhancedObj
}

module.exports = {
    extractPropertiesFromPath,
    enhanceLogWithAsyncContext,
}