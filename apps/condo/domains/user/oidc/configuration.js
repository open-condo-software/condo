const { getById } = require('@core/keystone/schema')

const { AdapterFactory } = require('./adapter')

module.exports = {
    adapter: AdapterFactory,
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
    interactions: {
        url (ctx, interaction) { // eslint-disable-line no-unused-vars
            return `/oidc/interaction/${interaction.uid}`
        },
    },
    cookies: {
        // TODO(pahaz): take it from .env!
        keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],

        // https://github.com/panva/node-oidc-provider/blob/HEAD/docs/README.md#cookiesshort
        short: {
            httpOnly: true,
            overwrite: true,
            sameSite: 'none',
        },

        long: {
            httpOnly: true,
            overwrite: true,
            sameSite: 'none',
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

        // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresissauthresp - OAuth 2.0 Authorization Server Issuer Identifier in Authorization Response
        issAuthResp: { enabled: true, ack: 'draft-04' }, // defaults to false

        // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresjwtintrospection - JWT Response for OAuth Token Introspection
        // jwtIntrospection: { enabled: true },

        // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresrevocation - OAuth 2.0 Token Revocation
        revocation: { enabled: true }, // defaults to false
    },
    ttl: {
        AccessToken: 1 * 60 * 60, // 1 hour in seconds
        AuthorizationCode: 10 * 60, // 10 minutes in seconds
        IdToken: 1 * 60 * 60, // 1 hour in seconds
        DeviceCode: 10 * 60, // 10 minutes in seconds
        RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
        Session: 365 * 24 * 60 * 60, // 365 day in seconds
        Interaction: 60 * 60, // 1 hour in seconds
    },

    // TODO(pahaz): think about pkce and keys!
    pkce: {
        required: () => false,
    },
}
