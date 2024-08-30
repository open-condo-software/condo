// NOTE: same as keystone logger
const falsey = require('falsey')
const { toString } = require('lodash')
const pino = require('pino')
const serializers = require('pino-std-serializers')

const { normalizeVariables } = require('./normalize')

const { safeFormatError } = require('../apolloErrorFormatter')

function toCount (data) {
    const count = parseInt(data)
    if (isNaN(count)) return 0
    return count
}

function getLogger (name) {
    return pino({
        name, enabled: falsey(process.env.DISABLE_LOGGING),
        serializers: {
            'data': normalizeVariables,
            'args': normalizeVariables,
            'opts': normalizeVariables,
            'result': normalizeVariables,
            'statusCode': toString,
            'status': toString,
            'path': toString,
            'method': toString,
            'ip': toString,
            'reqId': toString,
            'errId': toString,
            'taskId': toString,
            'message': toString,
            'error': safeFormatError,
            'req': serializers.req,
            'res': serializers.res,
            'err': serializers.err,
            'count': toCount,
        },
    })
}

module.exports = {
    getLogger,
}
