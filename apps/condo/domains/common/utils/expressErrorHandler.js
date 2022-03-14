const cuid = require('cuid')
const { get } = require('lodash')
const { serializeError } = require('serialize-error')

const { graphqlLogger } = require('@keystonejs/keystone/lib/Keystone/logger')

const expressErrorHandler = (err, req, res, next) => {
    const errId = cuid()
    const reqId = get(req, ['id'], get(req, ['headers', 'X-Request-Id']))
    graphqlLogger.error({ reason: 'expressErrorHandler', error: serializeError(err), errId, reqId, req })
    return res.status(500).send(`Error! errId=${errId}; reqId=${reqId}`)
}

module.exports = {
    expressErrorHandler,
}
