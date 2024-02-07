const express = require('express')

const { UNSUBSCRIBE_LINK_PATH } = require('@condo/domains/notification/constants/links')
const { UnsubscribeLinkRouter } = require('@condo/domains/notification/routes/unsubscribeLinkRouter')

class UnsubscribeMiddleware {
    async prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        const router = new UnsubscribeLinkRouter()
        await router.init()
        app.get(UNSUBSCRIBE_LINK_PATH, router.handleRequest.bind(router))

        return app
    }
}

module.exports = {
    UnsubscribeMiddleware,
}
