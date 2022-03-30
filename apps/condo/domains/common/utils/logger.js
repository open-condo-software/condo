const pino = require('pino')
const falsey = require('falsey')
const appLogger = pino({ name: process.env.LOGGER_NAME || 'condo', enabled: falsey(process.env.DISABLE_LOGGING)  })

class Logger {

    constructor (name, level = 'debug') {
        this.logger = appLogger.child({ module: name })
        this.logger.level = level
    }

    printLog (message, params = {}, type) {
        this.logger[type]({ message, ...params })
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
    appLogger,
    Logger,
}