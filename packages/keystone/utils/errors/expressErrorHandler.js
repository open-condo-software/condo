const get = require('lodash/get')

const conf = require('@open-condo/config')
const {
    GQLErrorCode: {
        INTERNAL_ERROR,
    },
    HTTPStatusByGQLErrorCode,
} = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')

const { safeFormatError } = require('./safeFormatError')
const { wrapWithGQLError } = require('./wrapWithGQLError')


const logger = getLogger('express-error-handler')

const IS_HIDE_INTERNALS = conf.NODE_ENV === 'production'

const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'

const INTERNAL_SERVER_ERROR_GQL = {
    code: INTERNAL_ERROR,
    type: INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
}

function expressErrorHandler (err, req, res, next) {
    if (!err) return next()
    const gqlError = wrapWithGQLError(err, { req }, INTERNAL_SERVER_ERROR_GQL)
    const reqId = get(req, ['id'], get(req, ['headers', 'X-Request-Id']))
    const errId = gqlError.uid
    logger.error({ msg: 'express-error-handler', err, req, res, reqId, errId })

    const errCode = gqlError?.extensions?.code || INTERNAL_ERROR
    const status = HTTPStatusByGQLErrorCode[errCode] || HTTPStatusByGQLErrorCode[INTERNAL_ERROR]

    // NOTE: wrap with errors to make response look similar to GQL ones, so handlers can be reused
    res.status(status).json({
        errors: [
            safeFormatError(gqlError, IS_HIDE_INTERNALS, true),
        ],
    })
}

module.exports = {
    expressErrorHandler,
}