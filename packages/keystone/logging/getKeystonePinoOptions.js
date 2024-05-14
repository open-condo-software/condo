const serializers = require('pino-std-serializers')

const { getLogger } = require('./getLogger')
const { getReqLoggerContext } = require('./getReqLoggerContext')
const logger = getLogger('http')
const IGNORE_PATH = new Set(['/api/features', '/api/version', '/favicon.ico'])

function getKeystonePinoOptions () {
    // NOTE(pahaz): https://github.com/pinojs/pino-http#pinohttpopts-stream
    return {
        logger,
        autoLogging: {
            ignore: (req) => IGNORE_PATH.has(req.url),
        },
        customProps: (req, res) => {
            return getReqLoggerContext(req)
        },
        serializers: {
            res: (res) => {
                const errors = res.raw.req.errors
                return { gqlErrors: errors, ...serializers.req(res) }
            },
        },
    }
}

module.exports = {
    getKeystonePinoOptions,
}
