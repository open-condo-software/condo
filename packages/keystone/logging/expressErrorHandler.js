const cuid = require('cuid')
const { get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('express-error-handler')

const expressErrorHandler = (err, req, res, next) => {
    if (!err) next()
    const errId = err.uid || cuid()
    const reqId = get(req, ['id'], get(req, ['headers', 'X-Request-Id']))
    logger.error({ msg: 'expressErrorHandler', err, req, res, reqId, errId })
    return res.status(500).send(`Error! errId=${errId}; reqId=${reqId}`)
}

module.exports = {
    expressErrorHandler,
}
