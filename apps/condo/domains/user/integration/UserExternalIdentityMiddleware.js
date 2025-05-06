const express = require('express')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { expressErrorHandler } = require('@open-condo/keystone/logging/expressErrorHandler')

const { SbbolRoutes } = require('@condo/domains/organization/integrations/sbbol/routes')
const { AppleIdRoutes } = require('@condo/domains/user/integration/appleid/routes')
const { SberIdRoutes } = require('@condo/domains/user/integration/sberid/routes')
const { TelegramOauthRoutes } = require('@condo/domains/user/integration/telegram/routes')


const logger = getLogger('user-external-identity-middleware-setup')

function addTelegramOauthRoutes (app) {
    try {
        const TELEGRAM_OAUTH_CONFIG = JSON.parse(conf.TELEGRAM_OAUTH_CONFIG || '[]')
        const uniqueRouteNames = new Set(TELEGRAM_OAUTH_CONFIG.map(conf => conf.route))
        if (uniqueRouteNames.size !== TELEGRAM_OAUTH_CONFIG.length) {
            const duplicateNames = [...uniqueRouteNames].filter(route => TELEGRAM_OAUTH_CONFIG.filter(conf => conf.route === route).length > 1)
            throw new Error(`Route names contains duplicates: "${duplicateNames.join('", "')}"`)
        }
        for (const { route, botToken, allowedUserTypes, redirectUrls, residentRedirectUrl } of TELEGRAM_OAUTH_CONFIG) {
            const telegramOauthRoutes = new TelegramOauthRoutes(route, botToken, redirectUrls, allowedUserTypes, residentRedirectUrl)
            app.post(`/api/${route}/auth/callback`, /*bodyParser.json(),*/ telegramOauthRoutes.completeAuth.bind(telegramOauthRoutes))
        }
    } catch (error) {
        logger.error({ msg: 'Register telegram oauth callback route error', error: JSON.stringify(error) })
    }
}

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
        addTelegramOauthRoutes(app)

        // error handler
        app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    UserExternalIdentityMiddleware,
}