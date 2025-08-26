const express = require('express')
const { get, isObject, isString } = require('lodash')
const { generators } = require('openid-client')

const { OIDCHelper } = require('@{{name}}/domains/condo/utils/oidcHelper')
const { createOrUpdateUser } = require('@{{name}}/domains/user/utils/serverSchema/createOrUpdateUser')

// TODO(DOMA-9342): move oidc logic to separate package
class CondoOIDCMiddleware {
    prepareMiddleware ({ keystone }) {
        // this route can not be used for csrf attack (use oidc-client library to handle auth flows properly)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const oidcSessionKey = 'oidc'
        const redirectKey = 'next'
        const helper = new OIDCHelper()

        app.get('/oidc/auth', async (req, res, next) => {
            const checks = { nonce: generators.nonce(), state: generators.state() }
            req.session[oidcSessionKey] = checks

            const nextUrl = get(req, 'query.next')
            if (isString(nextUrl)) {
                req.session[redirectKey] = nextUrl
            }

            await req.session.save()
            try {
                const redirectUrl = helper.getAuthorizationUrlWithParams(checks)
                return res.redirect(redirectUrl)
            } catch (err) {
                await req.session.destroy()
                return next(err)
            }
        })

        app.get('/oidc/callback', async (req, res, next) => {
            try {
                const checks = req.session[oidcSessionKey]
                const nextUrl = req.session[redirectKey] || '/'

                if (!isObject(checks) || !checks) {
                    await req.session.destroy()
                    return res.status(400).send('ERROR: Invalid nonce and state')
                }

                const { userInfo } = await helper.completeAuth(req, checks)
                const user = await createOrUpdateUser(keystone, userInfo)
                await keystone._sessionManager.startAuthedSession(req, {
                    item: { id: user.id },
                    list: keystone.lists['User'],
                    meta: {
                        source: 'oidc',
                        provider: 'condo',
                        clientID: helper.clientID,
                    },
                })

                delete req.session[oidcSessionKey]
                await req.session.save()

                return res.redirect(nextUrl)
            } catch (err) {
                return next(err)
            }
        })

        app.set('trust proxy', true)

        return app
    }
}

module.exports = {
    CondoOIDCMiddleware,
}
