const pino = require('pino')
const falsey = require('falsey')
const appLogger = pino({ name: process.env.LOGGER_NAME || 'condo', enabled: falsey(process.env.DISABLE_LOGGING)  })

class Logger {

    colors = { debug: '\x1b[32m', info: '\x1b[0m', error: '\x1b[31m', reset: '\x1b[0m' }

    constructor (name, level = 'debug') {
        this.logger = appLogger.child({ module: name })
        this.logger.level = level
    }

    printLog (message, params = {}, type) {
        process.stdout.write(this.colors[type])
        this.logger[type]({ message, ...params })
        process.stdout.write(this.colors.reset)
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