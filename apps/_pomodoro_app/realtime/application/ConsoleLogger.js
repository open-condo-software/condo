AbstractLogger = require('./AbstractLogger')

class ConsoleLogger extends AbstractLogger {
    log(entry) {
        console.log(entry)
    }
}

module.exports = ConsoleLogger
