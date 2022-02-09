const pino = require('pino')
const falsey = require('falsey')

const logger = pino({ name: 'oidc', enabled: falsey(process.env.DISABLE_LOGGING) })

module.exports = {
    logger,
}
