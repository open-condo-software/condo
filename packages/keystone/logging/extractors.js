const path = require('path')

const { getExecutionContext } = require('@open-condo/keystone/executionContext')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')

/**
 * @private
 */
function _isApp (pathParts) {
    return Array.isArray(pathParts) && pathParts.length > 1 && pathParts[0] === 'apps'
}

/**
 * @private
 */
function _isPackage (pathParts) {
    return Array.isArray(pathParts) && pathParts.length > 1 && pathParts[0] === 'packages'
}

/**
 * @private
 */
function _isInDomain (pathParts) {
    return _isApp(pathParts) && pathParts.length > 3 && pathParts[2] === 'domains'
}

/**
 * @private
 */
function _findTasksIndex (pathParts) {
    if (!_isPackage(pathParts) && !_isApp(pathParts)) return -1

    return pathParts.indexOf('tasks')
}

/**
 * @deprecated Internal logging util. You should not use it directly
 * @private
 */
function _extractPropertiesFromPath (loggerUnixPath) {
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
    const tasksIndex = _findTasksIndex(pathParts)
    if (tasksIndex >= 0 && pathParts.length > tasksIndex + 1) {
        const fileOrDirName = path.parse(pathParts[tasksIndex + 1]).name
        if (fileOrDirName !== 'index') {
            properties['taskName'] = fileOrDirName
        }
    }

    // Extract fileName for search shortcut
    properties['fileName'] = pathParts[pathParts.length - 1]

    return properties
}

/**
 * @deprecated Internal logging util. You should not use it directly
 * @private
 */
function _enhanceLogWithAsyncContext (dataObj) {
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

/**
 * @deprecated Internal logging util. You should not use it directly
 * SRC: https://github.com/sindresorhus/callsites/blob/main/index.js
 * @private
 */
function _callsites () {
    const _prepareStackTrace = Error.prepareStackTrace
    try {
        let result = []
        Error.prepareStackTrace = (_, callSites) => {
            const callSitesWithoutCurrent = callSites.slice(1)
            result = callSitesWithoutCurrent
            return callSitesWithoutCurrent
        }

        new Error().stack

        return result
    } finally {
        Error.prepareStackTrace = _prepareStackTrace
    }
}

module.exports = {
    _extractPropertiesFromPath,
    _enhanceLogWithAsyncContext,
    _callsites,
}