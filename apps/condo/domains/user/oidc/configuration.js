const { get } = require('lodash')

const { getById } = require('@open-condo/keystone/schema')

const { createAdapterClass } = require('./adapter')

const HTTPS_REGEXP = /^https:/

module.exports = function createConfiguration (context, conf) {
    const jwksStr = get(conf, 'JWKS')

    return {
        adapter: createAdapterClass(context),
        async findAccount (ctx, id) {
            const user = await getById('User', id)
            if (!user) throw new Error('unknown user id')
            // TODO(pahaz): think about user and and claims
            return {
                accountId: id,
                async claims (use, scope) {
                    return {
                        sub: id,
                        v: user.v,
                        dv: user.dv,
                        type: user.type,
                        name: user.name,
                        isSupport: user.isSupport,
                        isAdmin: user.isAdmin,
                    }
                },
            }
        },
        /**
         * @see https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#issuerefreshtoken
         * @param ctx
         * @param client
         * @param code
         * @returns {Promise<boolean>}
         */
        async issueRefreshToken (ctx, client, code) {
            return client.grantTypeAllowed('refresh_token')
        },
        async loadExistingGrant (ctx) {
            // This is modified version of default function
            // https://github.com/panva/node-oidc-provider/blob/HEAD/docs/README.md#loadexistinggrant

            // NOTE: OIDC Session lives separately from keystone one,
            // so below is a quick fix to properly validate existing grant
            // If existing grant is returned -> user will be redirected directly to callback section
            // If no grant found (undefined return) -> user will be redirected to interaction page

            const grantId = (ctx.oidc.result
                && ctx.oidc.result.consent
                && ctx.oidc.result.consent.grantId) || ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId)

            if (grantId) {
                const grant = await ctx.oidc.provider.Grant.find(grantId)

                const userId = get(ctx, ['req', 'user', 'id'], null)
                const accountId = get(grant, 'accountId', null)

                // If grant exists and its accountId is equal to current keystone user id = return existing grant
                if (userId && accountId && accountId === userId) {
                    return grant
                }

                return undefined
            }

            return undefined
        },
        interactions: {
            url (ctx, interaction) { // eslint-disable-line no-unused-vars
                return `/oidc/interaction/${interaction.uid}`
            },
        },
        cookies: {
            // TODO(pahaz): take it from .env!
            keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
            short: {
                sameSite: HTTPS_REGEXP.test(conf.SERVER_URL) ? 'None' : 'Lax',
                secure: HTTPS_REGEXP.test(conf.SERVER_URL),
            },
            long: {
                sameSite: HTTPS_REGEXP.test(conf.SERVER_URL) ? 'None' : 'Lax',
                secure: HTTPS_REGEXP.test(conf.SERVER_URL),
            },
        },
        claims: {
            // TODO(pahaz): SCOPES think about it!
            openid: ['sub', 'v', 'dv', 'type', 'name', 'isAdmin', 'isSupport'],
        },
        features: {
            // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresclientcredentials - Enables grant_type=client_credentials to be used on the token endpoint
            clientCredentials: { enabled: true }, // defaults to false

            // Development-ONLY out of the box interaction views bundled with the library allow you to skip the boring frontend part while experimenting with oidc-provider. Enter any username (will be used as sub claim value) and any password to proceed.
            // Be sure to disable and replace this feature with your actual frontend flows and End-User authentication flows as soon as possible. These views are not meant to ever be seen by actual users.
            devInteractions: { enabled: false }, // defaults to false

            // https://tools.ietf.org/html/rfc8628 -- OAuth 2.0 Device Authorization Grant (Device Flow)
            // deviceFlow: { enabled: true }, // defaults to false

            // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresintrospection - RFC7662 - OAuth 2.0 Token Introspection
            // introspection: { enabled: true }, // defaults to false

            // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresjwtintrospection - JWT Response for OAuth Token Introspection
            // jwtIntrospection: { enabled: true },

            // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresrevocation - OAuth 2.0 Token Revocation
            revocation: { enabled: true }, // defaults to false
        },
        ttl: {
            //todo(AleX83Xpert): back to one hour after DOMA-3165 finished
            AccessToken: 1 * 60 * 60 * 24 * 365, // 1 year in seconds
            AuthorizationCode: 10 * 60, // 10 minutes in seconds
            IdToken: 1 * 60 * 60, // 1 hour in seconds
            DeviceCode: 10 * 60, // 10 minutes in seconds
            RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
            Session: 365 * 24 * 60 * 60, // 365 day in seconds
            Interaction: 60 * 60, // 1 hour in seconds
        },
        // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#responsetypes
        responseTypes: [
            'code id_token',
            'code',
            'id_token',
            'id_token token', // implicit flow with token!
        ],
        // TODO(pahaz): think about pkce and keys!
        pkce: {
            required: () => false,
        },
        /**
         * @link https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#jwks
         * The key set may be generated with {@link https://mkjwk.org/}
         */
        jwks: jwksStr ? JSON.parse(jwksStr) : undefined,
    }
}
