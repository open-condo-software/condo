const { get, isNil } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('auth/routes')

function handleAuthRouteError ({ redirectUrl, error, req, res, next }) {
    logger.error({ msg: `Auth error ${req.path}`, err: error, reqId: req.id })

    // no redirectUrl set up
    if (isNil(redirectUrl)) {
        return next()
    }

    // get an error description
    const errorMessage = get(error, 'errors[0].message') || get(error, 'message') || JSON.stringify(error)

    // assemble redirect link
    const link = new URL(redirectUrl)
    link.searchParams.set('error', 'true')
    link.searchParams.set('errorMessage', errorMessage)

    // redirect
    return res.redirect(link)
}

module.exports = {
    handleAuthRouteError,
}