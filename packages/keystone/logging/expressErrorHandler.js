const cuid = require('cuid')
const { get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('expressErrorHandler')

const expressErrorHandler = (error, req, res, next) => {
    if (!error) next()
    const errId = error.uid || cuid()
    const reqId = get(req, ['id'], get(req, ['headers', 'X-Request-Id']))
    logger.error({ msg: 'expressErrorHandler', error, reqId, errId })
    return res.status(500).send(`Error! errId=${errId}; reqId=${reqId}`)
}

module.exports = {
    expressErrorHandler,
}
