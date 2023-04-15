const express = require('express')

const { expressErrorHandler } = require('@open-condo/keystone/logging/expressErrorHandler')

const { SbbolRoutes } = require('@condo/domains/organization/integrations/sbbol/routes')
const { SberIdRoutes } = require('@condo/domains/user/integration/sberid/routes')

class UserExternalIdentityMiddleware {
    async prepareMiddleware ({ keystone }) {
        const app = express()

        // sbbol route
        const sbbolRoutes = new SbbolRoutes()
        app.get('/api/sbbol/auth', sbbolRoutes.startAuth.bind(sbbolRoutes))
        app.get('/api/sbbol/auth/callback', sbbolRoutes.completeAuth.bind(sbbolRoutes))

        // sber_id route
        const sberIdRoutes = new SberIdRoutes()
        app.get('/api/sber_id/auth', sberIdRoutes.startAuth.bind(sberIdRoutes))
        app.get('/api/sber_id/auth/callback', sberIdRoutes.completeAuth.bind(sberIdRoutes))

        // error handler
        app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    UserExternalIdentityMiddleware,
}