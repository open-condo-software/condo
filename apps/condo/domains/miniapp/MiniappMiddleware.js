const express = require('express')

const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const { getVoIPCallStatus } = require('@condo/domains/miniapp/utils/serverSchema') 

const GET_VOIP_CALL_STATUS_URL_PATH = '/api/getVoIPCallStatus'

function asyncErrorHandler (handler) {
    return async function wrappedAsyncErrorHandler (req, res, next) {
        try {
            await handler(req, res, next)
        } catch (err) {
            next(err)
        }
    }
}

class MiniappMiddleware {
    keystone

    constructor () {
        this.handleGetVoIPCallStatus = this.handleGetVoIPCallStatus.bind(this)
    }

    async handleGetVoIPCallStatus (req, res, next) {
        const { callStatusToken, callId, organizationId, addressKey, appId } = req.query
        let { dv, sender } = req.query

        try {
            sender = JSON.parse(sender)
            dv = parseInt(dv)
        } catch {/* */}

        const context = await this.keystone.createContext()
        const result = await getVoIPCallStatus(context, { 
            callStatusToken,
            callId,
            dv,
            sender,
            addressKey, // TODO ! being changed in another PR parallely
            organization: { id: organizationId },
            app: { id: appId },
        })
        return res.json(result)
    }

    async prepareMiddleware ({ keystone }) {
        this.keystone = keystone
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.get(GET_VOIP_CALL_STATUS_URL_PATH, asyncErrorHandler(this.handleGetVoIPCallStatus))

        app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    MiniappMiddleware,

    GET_VOIP_CALL_STATUS_URL_PATH,
}
