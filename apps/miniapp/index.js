
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { NextApp } = require('@keystonejs/app-next')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { Keystone } = require('@keystonejs/keystone')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const express = require('express')
const { isObject, get } = require('lodash')
const { generators, Issuer } = require('openid-client') // certified openid client will all checks

const conf = require('@open-condo/config')
const { formatError } = require('@open-condo/keystone/apolloErrorFormatter')
const { registerSchemas } = require('@open-condo/keystone/KSv5v6/v5/registerSchema')
const { prepareDefaultKeystoneConfig } = require('@open-condo/keystone/setup.utils')
const { EmptyApp } = require('@open-condo/keystone/test.utils')

const { CONDO_ACCESS_TOKEN_KEY, CONDO_ORGANIZATION_KEY } = require('./domains/condo/constants/common')
const { createOrUpdateUser } = require('@miniapp/domains/condo/utils/serverSchema/createOrUpdateUser')

const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'

// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'

const defaultKeystoneConf = prepareDefaultKeystoneConfig(conf)

const keystone = new Keystone({
    ...defaultKeystoneConf,
    cookie: {
        ...defaultKeystoneConf.cookie,

        // Enable cross-site usage
        sameSite: 'none',
        secure: true,
    },
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development' && conf.NODE_ENV !== 'test') return // Just for dev env purposes!
        // This function can be called before tables are created! (we just ignore this)
        const users = await keystone.lists.User.adapter.findAll()
        if (!users.length) {
            const initialData = require('./initialData')
            for (let { listKey, items } of initialData) {
                console.log(`🗿 createItems(${listKey}) -> ${items.length}`)
                await createItems({
                    keystone,
                    listKey,
                    items,
                })
            }
        }
    },
})

registerSchemas(keystone, [
    require('@miniapp/domains/condo/schema/User'),
])

let authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
    config: {
        protectIdentities: true,
    },
})

class OIDCHelper {
    constructor () {
        const oidcClientConfig = conf.OIDC_CONDO_CLIENT_CONFIG
        if (!oidcClientConfig) throw new Error('no OIDC_CONDO_CLIENT_CONFIG env')
        const { serverUrl, clientId, clientSecret, clientOptions, issuerOptions } = JSON.parse(oidcClientConfig)
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

class CondoOIDCMiddleware {
    prepareMiddleware () {
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
            req.session[CONDO_ORGANIZATION_KEY] = get(req, ['query', 'organizationId'], '')
            await req.session.save()
            try {
                const redirectUrl = helper.getAuthorizationUrlWithParams({
                    ...checks,
                    condoUserId: get(req, 'query.condoUserId', undefined),
                })
                return res.redirect(redirectUrl)
            } catch (error) {
                return next(error)
            }
        })
        app.get('/oidc/callback', async (req, res, next) => {
            try {
                const checks = req.session[oidcSessionKey]
                const organizationId = req.session[CONDO_ORGANIZATION_KEY]
                if (!isObject(checks) || !checks) {
                    return res.status(400).send('ERROR: Invalid nonce and state')
                }

                const { accessToken, userInfo } = await helper.completeAuth(req, checks)
                const user = await createOrUpdateUser(keystone, userInfo)
                await keystone._sessionManager.startAuthedSession(req, {
                    item: { id: user.id },
                    list: keystone.lists['User'],
                })

                req.session[CONDO_ACCESS_TOKEN_KEY] = accessToken
                req.session[CONDO_ORGANIZATION_KEY] = organizationId
                delete req.session[oidcSessionKey]
                await req.session.save()

                return res.json({ user: { id: user.id } })
            } catch (error) {
                return next(error)
            }
        })
        return app
    }
}

module.exports = {
    keystone,
    apps: [
        new CondoOIDCMiddleware(),
        new GraphQLApp({
            apollo: {
                formatError,
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
            },
        }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport)),
            authStrategy,
        }),
        conf.NODE_ENV === 'test' ? new EmptyApp() : new NextApp({ dir: '.' }),
    ],
    configureExpress: (app) => {
        app.set('trust proxy', 1) // trust first proxy
    },
}
