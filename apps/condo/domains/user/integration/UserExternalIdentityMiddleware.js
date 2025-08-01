const express = require('express')

const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const { SbbolRoutes } = require('@condo/domains/organization/integrations/sbbol/routes')
const { AppleIdRoutes } = require('@condo/domains/user/integration/appleid/routes')
const { SberIdRoutes } = require('@condo/domains/user/integration/sberid/routes')
const { TelegramOauthRoutes } = require('@condo/domains/user/integration/telegram/routes')

const { PassportAuthRouter } = require('./passport')


class UserExternalIdentityMiddleware {
    async prepareMiddleware ({ keystone }) {
        // all bellow routes are handling csrf properly
        // and controlling start/end authorization sources (browsers, mobile clients, etc)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        // sbbol route
        const sbbolRoutes = new SbbolRoutes()
        app.get('/api/sbbol/auth', sbbolRoutes.startAuth.bind(sbbolRoutes))
        app.get('/api/sbbol/auth/callback', sbbolRoutes.completeAuth.bind(sbbolRoutes))

        // apple_id route
        const appleIdRoutes = new AppleIdRoutes()
        app.get('/api/apple_id/auth', appleIdRoutes.startAuth.bind(appleIdRoutes))
        app.get('/api/apple_id/auth/callback', appleIdRoutes.completeAuth.bind(appleIdRoutes))
        app.post('/api/apple_id/auth/callback', appleIdRoutes.completeAuth.bind(appleIdRoutes))

        // sber_id route
        const sberIdRoutes = new SberIdRoutes()
        app.get('/api/sber_id/auth', sberIdRoutes.startAuth.bind(sberIdRoutes))
        app.get('/api/sber_id/auth/callback', sberIdRoutes.completeAuth.bind(sberIdRoutes))

        // telegram oauth routes
        const telegramOauthRoutes = new TelegramOauthRoutes()
        app.get('/api/tg/auth', telegramOauthRoutes.startAuth.bind(telegramOauthRoutes))
        app.get('/api/tg/auth/callback', telegramOauthRoutes.completeAuth.bind(telegramOauthRoutes))

        const passportRouter = PassportAuthRouter.init()
        passportRouter.addPassportRoutes(app, keystone)

        // error handler
        app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    UserExternalIdentityMiddleware,
}
