const pino = require('pino')
const falsey = require('falsey')

const conf = require('@condo/config')

const logger = pino({ name: 'notification', enabled: falsey(conf.DISABLE_LOGGING) })

module.exports = {
    logger,
}
