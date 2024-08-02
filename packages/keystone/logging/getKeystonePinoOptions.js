const { getLogger } = require('./getLogger')
const { getReqLoggerContext } = require('./getReqLoggerContext')

const logger = getLogger('http')

function getKeystonePinoOptions () {
    // NOTE(pahaz): https://github.com/pinojs/pino-http#pinohttpopts-stream
    return {
        logger,
        autoLogging: false,
        customProps: (req, res) => {
            return getReqLoggerContext(req)
        },
    }
}

module.exports = {
    getKeystonePinoOptions,
}
