// NOTE: same as keystone logger
const path = require('path')

const pino = require('pino')

const conf = require('@open-condo/config')

const {
    _extractPropertiesFromPath,
    _enhanceLogWithAsyncContext,
    _enhanceLogWithUnknownProperties,
    _callsites,
} = require('./extractors')
const { SERIALIZERS } = require('./serializers')

function _composeFormatters (formatters) {
    return function composedFormatter (dataObj) {
        let result = dataObj
        for (const formatter of formatters) {
            result = formatter(result)
        }

        return result
    }
}

const logFormatter = _composeFormatters([
    _enhanceLogWithAsyncContext,
    _enhanceLogWithUnknownProperties,
])



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
            log: logFormatter,
        },
        serializers: SERIALIZERS,
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
