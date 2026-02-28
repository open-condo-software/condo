const express = require('express')
const { isObject } = require('lodash')
const { Issuer, generators } = require('openid-client') // certified openid client will all checks

const conf = require('@open-condo/config')

const { createOrUpdateUser } = require('@billing-connector/domains/user/utils/serverSchema/createOrUpdateUser')

const CONDO_OIDC_TOKEN_KEY = 'condoAPIToken'
const APP_TOKEN_KEY = 'appAPIToken'

class OIDCHelper {
    constructor () {
        const oidcClientConfig = conf.OIDC_CONDO_CLIENT_CONFIG
        if (!oidcClientConfig) throw new Error('no OIDC_CONDO_CLIENT_CONFIG env')
        const DEFAULT_SERVER_URL = `${conf.CONDO_DOMAIN}/admin/api`
        const { serverUrl = DEFAULT_SERVER_URL, clientId, clientSecret, clientOptions, issuerOptions } = JSON.parse(oidcClientConfig)

        if (!serverUrl || !clientId || !clientSecret) throw new Error('no serverUrl or clientId or clientSecret inside OIDC_CONDO_CLIENT_CONFIG env')

        this.redirectUrl = `${conf.SERVER_URL}/oidc/callback`
        this.issuer = new Issuer({
            authorization_endpoint: `${serverUrl}/oidc/auth`,
            token_endpoint: `${serverUrl}/oidc/token`,
            end_session_endpoint: `${serverUrl}/oidc/session/end`,
            jwks_uri: `${serverUrl}/oidc/jwks`,
            revocation_endpoint: `${serverUrl}/oidc/token/revocation`,
            userinfo_endpoint: `${serverUrl}/oidc/me`,
            issuer: serverUrl,
            ...(issuerOptions || {}),
        })
        this.client = new this.issuer.Client({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: [this.redirectUrl], // using uri as redirect_uri to show the ID Token contents
            response_types: ['code id_token'],
            token_endpoint_auth_method: 'client_secret_basic',
            ...(clientOptions || {}),
        })
    }

    authorizationUrlWithParams (checks) {
        return this.client.authorizationUrl({
            response_type: 'code',
            ...checks,
        })
    }

    async completeAuth (inputOrReq, checks) {
        const params = this.client.callbackParams(inputOrReq)
        const { access_token } = await this.client.callback(this.redirectUrl, params, checks)
        const userInfo = await this.client.userinfo(access_token)
        return { token: access_token, userInfo }
    }
}

class CondoOIDCMiddleware {
    prepareMiddleware ({ keystone }) {
        // this route can not be used for csrf attack (use oidc-client library to handle auth flows properly)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const oidcSessionKey = 'oidc'
        const redirectKey = 'next'
        const helper = new OIDCHelper()
        app.get('/oidc/auth', async (req, res, next) => {
            // nonce: to prevent several callbacks from same request
            // state: to validate user browser on callback
            const checks = { nonce: generators.nonce(), state: generators.state() }
            req.session[redirectKey] = (req.query.next && typeof req.query.next === 'string') ? req.query.next : '/'
            req.session[oidcSessionKey] = checks
            await req.session.save()
            try {
                const redirectUrl = helper.authorizationUrlWithParams(checks)
                return res.redirect(redirectUrl)
            } catch (error) {
                return next(error)
            }
        })
        app.get('/oidc/callback', async (req, res, next) => {
            try {
                const checks = req.session[oidcSessionKey]
                const redirect = req.session[redirectKey] || '/'

                if (!isObject(checks) || !checks) {
                    return res.status(400).send('ERROR: Invalid nonce and state')
                }
                const { userInfo, token } = await helper.completeAuth(req, checks)
                const user = await createOrUpdateUser(keystone, userInfo)
                const appToken = await keystone._sessionManager.startAuthedSession(req, {
                    item: { id: user.id },
                    list: keystone.lists['User'],
                })

                delete req.session[oidcSessionKey]
                delete req.session[redirectKey]
                req.session[CONDO_OIDC_TOKEN_KEY] = token
                req.session[APP_TOKEN_KEY] = appToken
                await req.session.save()

                return res.redirect(redirect)
            } catch (error) {
                return next(error)
            }
        })
        return app
    }
}

module.exports = {
    CondoOIDCMiddleware,
    CONDO_OIDC_TOKEN_KEY,
    APP_TOKEN_KEY,
}
