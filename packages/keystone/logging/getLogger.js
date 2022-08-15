// NOTE: same as keystone logger
const pino = require('pino')
const falsey = require('falsey')
const serializers = require('pino-std-serializers')
const { toString } = require('lodash')

const { safeFormatError } = require('./apolloErrorFormatter')
const { normalizeVariables } = require('./normalize')

function getLogger (name) {
    return pino({
        name, enabled: falsey(process.env.DISABLE_LOGGING),
        serializers: {
            'data': normalizeVariables,
            'result': normalizeVariables,
            'reqId': toString,
            'message': toString,
            'error': safeFormatError,
            'req': serializers.req,
            'res': serializers.req,
            'err': serializers.err,
        },
    })
}

module.exports = {
    getLogger,
}
