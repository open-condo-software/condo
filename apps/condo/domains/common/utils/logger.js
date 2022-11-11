const { getLogger } = require('@open-condo/keystone/logging')

const appLogger = getLogger('common/deprecated/appLogger')

/** @deprecated: use getLogger for your cases! */
class Logger {

    constructor (name, level = 'debug') {
        this.logger = appLogger.child({ module: name })
        this.logger.level = level
    }

    printLog (message, params = {}, type) {
        this.logger[type]({ msg: message, data: params })
    }

    debug (message, params = {}) {
        this.printLog(message, params, 'debug')
    }

    error (message, params = {}) {
        this.printLog(message, params, 'error')
    }

    info (message, params = {}) {
        this.printLog(message, params, 'info')
    }
}

module.exports = {
    Logger,
}