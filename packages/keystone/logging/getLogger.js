// NOTE: same as keystone logger
const path = require('path')

const { toString } = require('lodash')
const pino = require('pino')
const serializers = require('pino-std-serializers')

const conf = require('@open-condo/config')

const { _extractPropertiesFromPath, _enhanceLogWithAsyncContext, _callsites } = require('./extractors')
const { normalizeVariables } = require('./normalize')

const { safeFormatError } = require('../utils/errors/safeFormatError')

function toCount (data) {
    const count = parseInt(data)
    if (isNaN(count)) return 0
    return count
}

/**
 * Gets logger instance
 * @param {string} [name] - name of logger, if not specified - resolves relative filename to project root
 */
function getLogger (name) {
    let isNameResolved = false
    // NOTE: resolve filename by default
    if (!name) {
        const callStack = _callsites()
        if (callStack.length > 1) {
            // NOTE: On top of stack current file, so we need one before last
            const callerFilename = callStack[1].getFileName()
            const relativePath = path.relative(conf.PROJECT_ROOT, callerFilename)
            const normalizedPath = relativePath.split(path.sep).join('/')
            name = normalizedPath
            isNameResolved = true
        }
    }

    const logger = pino({
        name,
        enabled: process.env.DISABLE_LOGGING !== 'true',
        formatters: {
            log: _enhanceLogWithAsyncContext,
        },
        serializers: {
            'data': normalizeVariables,
            'args': normalizeVariables,
            'opts': normalizeVariables,
            'result': normalizeVariables,
            'statusCode': toString,
            'status': toString,
            'path': toString,
            'method': toString,
            'ip': toString,
            'reqId': toString,
            'errId': toString,
            'taskId': toString,
            'message': toString,
            'error': safeFormatError,
            'req': serializers.req,
            'res': serializers.res,
            'err': serializers.err,
            'count': toCount,
        },
    })

    // For common named loggers does not resolve anything additional
    if (!isNameResolved) {
        return logger
    }

    // For file-based loggers try to resolve task name, domain to simplify search
    return logger.child(_extractPropertiesFromPath(name))
}

module.exports = {
    getLogger,
}
