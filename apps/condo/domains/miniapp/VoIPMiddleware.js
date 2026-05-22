const express = require('express')

const { GQLError, GQLInternalErrorTypes: { SUB_GQL_ERROR } } = require('@open-condo/keystone/errors')
const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const { getVoIPCallStatus } = require('@condo/domains/miniapp/utils/serverSchema') 

const GET_VOIP_CALL_STATUS_URL_PATH = '/api/rest/v1/getVoIPCallStatus'

function asyncErrorHandler (handler) {
    return async function wrappedAsyncErrorHandler (req, res, next) {
        try {
            await handler(req, res, next)
        } catch (err) {
            if (err instanceof GQLError && err.extensions?.type === SUB_GQL_ERROR && err.errors.length) {
                const innerError = err.errors[0]
                if (innerError instanceof GQLError) return next(innerError)
                if (
                    innerError.extensions?.code &&
                    innerError.extensions?.type &&
                    innerError.extensions?.message
                )
                    return next(new GQLError(innerError.extensions, req.keystoneContext))
            }
            return next(err)
        }
    }
}

class VoIPMiddleware {
    /** @type {import('@open-keystone/keystone').Keystone */
    keystone

    constructor () {
        this.withKeystoneContext = this.withKeystoneContext.bind(this)
        this.handleGetVoIPCallStatus = this.handleGetVoIPCallStatus.bind(this)
    }

    async handleGetVoIPCallStatus (req, res, next) {
        const { token } = req.query
        let { dv, sender } = req.query

        try {
            sender = JSON.parse(sender)
            dv = parseInt(dv)
        } catch {/* */}
        
        const result = await getVoIPCallStatus(req.keystoneContext, {
            token,
            dv,
            sender,
        })
        return res.json(result)
    }

    async prepareMiddleware ({ keystone }) {
        this.keystone = keystone
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.get(GET_VOIP_CALL_STATUS_URL_PATH, this.withKeystoneContext, asyncErrorHandler(this.handleGetVoIPCallStatus))

        app.use(expressErrorHandler)

        return app
    }

    withKeystoneContext (req, res, next) {
        req.keystoneContext = { 
            ...this.keystone.createContext({
                authentication: { item: req.user, listKey: req.authedListKey },
                skipAccessControl: false,
            }),
            req,
        }
        return next()
    }
}

module.exports = {
    VoIPMiddleware,

    GET_VOIP_CALL_STATUS_URL_PATH,
}
