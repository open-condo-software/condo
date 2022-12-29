const express = require('express')
const { expressErrorHandler } = require('@condo/domains/common/utils/expressErrorHandler')

const { SbbolRoutes } = require('@condo/domains/organization/integrations/sbbol/routes')
const { UserExternalIdentityRoute } = require('@condo/domains/user/routes/UserExternalIdentityRoute')

const {
    USER_EXTERNAL_IDENTITY_AUTH_PATH,
    USER_EXTERNAL_IDENTITY_AUTH_CALLBACK_PATH,
} = require('@condo/domains/user/constants/links')

class UserExternalIdentityMiddleware {
    async prepareMiddleware ({ keystone }) {
        const app = express()

        // sbbol route
        const Auth = new SbbolRoutes()
        app.get('/api/sbbol/auth', Auth.startAuth.bind(Auth))
        app.get('/api/sbbol/auth/callback', Auth.completeAuth.bind(Auth))

        // generic router
        const router = new UserExternalIdentityRoute()
        app.get(USER_EXTERNAL_IDENTITY_AUTH_PATH, router.startAuth.bind(router))
        app.get(USER_EXTERNAL_IDENTITY_AUTH_CALLBACK_PATH, router.completeAuth.bind(router))

        // error handler
        app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    UserExternalIdentityMiddleware,
}