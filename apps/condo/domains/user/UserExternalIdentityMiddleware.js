const express = require('express')

const { UserExternalIdentityRoute } = require('@condo/domains/user/routes/UserExternalIdentityRoute')
const { USER_EXTERNAL_IDENTITY_CALLBACK_PATH } = require('@condo/domains/user/constants/links')

class UserExternalIdentityMiddleware {
    async prepareMiddleware ({ keystone }) {
        const app = express()
        const router = new UserExternalIdentityRoute()
        await router.init()

        app.get(USER_EXTERNAL_IDENTITY_CALLBACK_PATH, router.handleRequest.bind(router))

        return app
    }
}

module.exports = {
    UserExternalIdentityMiddleware,
}