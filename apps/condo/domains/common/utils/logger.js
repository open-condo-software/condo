const pino = require('pino')
const falsey = require('falsey')
const condoLogger = pino({ name: 'condo', enabled: falsey(process.env.DISABLE_LOGGING)  })

class Logger {

    colors = { debug: '\x1b[32m', info: '\x1b[0m', error: '\x1b[31m', reset: '\x1b[0m' }

    constructor (name, level = 'debug') {
        this.logger = condoLogger.child({ module: name })
        this.logger.level = level
    }

    setColor (type) {
        process.stdout.write(this.colors[type])
    }

    resetColor () {
        process.stdout.write(this.colors.reset)
    }

    printLog (message, params = {}, type) {
        this.setColor(type)
        this.logger[type]({ message, ...params })
        this.resetColor()
    }

    debug (message, params = {}) {
        this.printLog(message, params, 'debug')
    }

    setColor (type) {
        process.stdout.write(this.colors[type])
    }

    resetColor () {
        process.stdout.write(this.colors.reset)
    }

    printLog (message, params = {}, type) {
        this.setColor(type)
        this.logger[type]({ message, ...params })
        this.resetColor()
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
    condoLogger,
    Logger,
}