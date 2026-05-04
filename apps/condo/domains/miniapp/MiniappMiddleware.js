const express = require('express')

const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const { sendDTMFToB2CApp } = require('@condo/domains/miniapp/utils/serverSchema')


class MiniappMiddleware {
    keystone

    constructor () {
        this.handleSendDTMFToB2CApp = this.handleSendDTMFToB2CApp.bind(this)
    }

    async handleSendDTMFToB2CApp (req, res, next) {
        const { callStatusToken, propertyId, organizationId, callId, appId, dtmfCode } = req.query
        let { sender, dv } = req.query

        const context = this.keystone.createContext()

        try {
            sender = JSON.parse(sender)
            dv = parseInt(dv)
        } catch { /* */ }

        try {
            const result = await sendDTMFToB2CApp(context, {
                callId,
                app: { id: appId },
                property: { id: propertyId },
                organization: { id: organizationId },
                callStatusToken,
                data: {
                    dtmfCode,
                },
                dv,
                sender,
            })
            return res.json(result)
        } catch (err) {
            next(err)
        }
    }

    async prepareMiddleware ({ keystone }) {
        this.keystone = keystone
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.get('/api/sendDTMFToB2CApp', this.handleSendDTMFToB2CApp)

        app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    MiniappMiddleware,
}
