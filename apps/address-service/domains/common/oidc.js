const express = require('express')
const { get, isObject } = require('lodash')
const { generators, Issuer } = require('openid-client')

const conf = require('@open-condo/config')

const { createOrUpdateUser } = require('@address-service/domains/common/utils/serverSchema/createOrUpdateUser')

class OIDCHelper {
    constructor () {
        const oidcClientConfig = conf.OIDC_CONFIG
        if (!oidcClientConfig) throw new Error('no OIDC_CONFIG env')

        const { serverUrl, clientId, clientSecret, clientOptions, issuerOptions } = JSON.parse(oidcClientConfig)
        if (!serverUrl || !clientId || !clientSecret) throw new Error('no serverUrl or clientId or clientSecret inside OIDC_CONFIG env')

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
        this.clientID = clientId
    }

    getAuthorizationUrlWithParams (checks) {
        return this.client.authorizationUrl({
            response_type: 'code',
            ...checks,
        })
    }

    /**
     * @param inputOrReq
     * @param checks
     * @returns {Promise<{userInfo: Object, accessToken: string}>}
     */
    async completeAuth (inputOrReq, checks) {
        const params = this.client.callbackParams(inputOrReq)
        const credentials = await this.client.callback(this.redirectUrl, params, checks)
        const { access_token: accessToken } = credentials
        const userInfo = await this.client.userinfo(accessToken)
        return { accessToken, userInfo }
    }
}

class OIDCKeystoneApp {
    prepareMiddleware ({ keystone, distDir, dev }) {
        // this route can not be used for csrf attack (use oidc-client library to handle auth flows properly)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const oidcSessionKey = 'oidc'
        const helper = new OIDCHelper()

        app.get('/oidc/auth', async (req, res, next) => {
            // nonce: to prevent several callbacks from same request
            // state: to validate user browser on callback
            const checks = { nonce: generators.nonce(), state: generators.state() }
            req.session[oidcSessionKey] = checks
            await req.session.save()
            try {
                const redirectUrl = helper.getAuthorizationUrlWithParams(checks)
                return res.redirect(redirectUrl)
            } catch (err) {
                return next(err)
            }
        })

        app.get('/oidc/callback', async (req, res, next) => {
            try {
                const checks = req.session[oidcSessionKey]
                if (!isObject(checks) || !checks) {
                    return res.status(400).send('ERROR: Invalid nonce and state')
                }

                const { accessToken, userInfo } = await helper.completeAuth(req, checks)

                if (!userInfo.isAdmin && !userInfo.isSupport) {
                    return res.status(404).send(`ERROR: "${get(userInfo, 'name', 'unknown name')}" is neither admin nor support user`)
                }

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

                return res.redirect('/admin')
            } catch (err) {
                return next(err)
            }
        })

        return app
    }
}

module.exports = { OIDCKeystoneApp }
