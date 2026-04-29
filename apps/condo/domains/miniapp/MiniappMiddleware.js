const express = require('express')

const { sendDTMFToB2CApp } = require('@condo/domains/miniapp/utils/serverSchema')


class MiniappMiddleware {
    keystone

    constructor () {
        this.handleSendDTMFToB2CApp = this.handleSendDTMFToB2CApp.bind(this)
    }

    async handleSendDTMFToB2CApp (req, res, next) {
        const { callStatusToken, propertyId, organizationId, callId, b2cAppId, dtmfCode } = req.query
        const context = this.keystone.createContext()

        try {
            const result = await sendDTMFToB2CApp(context, {
                callId,
                app: { id: b2cAppId },
                property: { id: propertyId },
                organization: { id: organizationId },
                callStatusToken,
                data: {
                    dtmfCode,
                },
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

        return app
    }
}

module.exports = {
    MiniappMiddleware,
}
