const cuid = require('cuid')
const { get } = require('lodash')
const { serializeError } = require('serialize-error')
const { graphqlLogger } = require('@keystonejs/keystone/lib/Keystone/logger')

const expressErrorHandler = (err, req, res, next) => {
    if (!err) next()
    const errId = cuid()
    const reqId = get(req, ['id'], get(req, ['headers', 'X-Request-Id']))
    // `serialize-error` will pick only following properties: `message`, `locations`, `path`, `name`, `stack`
    const graphQLError = { reason: 'expressErrorHandler', error: serializeError(err), errId, reqId }
    // It's not enough, because critical information from GraphQL mutations is provided in `originalError` property
    if (err.originalError) {
        graphQLError.originalError = serializeError(err.originalError)
    }
    graphqlLogger.error(graphQLError)
    return res.status(500).send(`Error! errId=${errId}; reqId=${reqId}`)
}

module.exports = {
    expressErrorHandler,
}