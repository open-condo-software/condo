// @ts-check
const { Strategy: CustomStrategy } = require('passport-custom')

const  { GQLError } = require('@open-condo/keystone/errors')
const { fetch } = require('@open-condo/keystone/fetch')

const { ERRORS } = require('@condo/domains/user/integration/passport/errors')
const { syncUser } = require('@condo/domains/user/integration/passport/utils/user')

const { AuthStrategy } = require('./types')

/** @implements AuthStrategy */
class OidcTokenUserInfoAuthStrategy {
    #strategyTrustInfo = { trustEmail: false, trustPhone: false }
    #authURL
    #callbackURL
    #clients = {}

    constructor (strategyConfig, routes) {
        const { options, trustEmail, trustPhone } = strategyConfig
        const { clients } = options
        const { authURL, callbackURL } = routes

        this.#authURL = authURL
        this.#callbackURL = callbackURL

        this.#clients = clients
        this.#strategyTrustInfo = { trustEmail, trustPhone }
    }


    build () {
        const callbackPath = new URL(this.#callbackURL).pathname
        const clients = this.#clients
        const strategyTrustInfo = this.#strategyTrustInfo

        return new CustomStrategy(async function verify (req, done) {
            // On auth endpoint redirect to callbackURL to be consistent with other strategies
            if (req.path !== callbackPath) {
                const searchParams = req.originalUrl.split('?')[1]
                return req.res.redirect([callbackPath, searchParams].filter(Boolean).join('?'))
            }

            // Parameters verification
            const { access_token, client_id } = req.query
            const errorContext = { req }
            if (!access_token) {
                return done(new GQLError({
                    ...ERRORS.MISSING_QUERY_PARAMETER,
                    messageInterpolation: { parameter: 'access_token' },
                }, errorContext))
            }
            if (typeof access_token !== 'string') {
                return done(new GQLError({
                    ...ERRORS.INVALID_PARAMETER,
                    messageInterpolation: { parameter: 'access_token' },
                }, errorContext))
            }
            if (!client_id) {
                return done(new GQLError({
                    ...ERRORS.MISSING_QUERY_PARAMETER,
                    messageInterpolation: { parameter: 'client_id' },
                }, errorContext))
            }
            if (typeof client_id !== 'string' || !Object.hasOwn(clients, client_id)) {
                return done(new GQLError({
                    ...ERRORS.INVALID_PARAMETER,
                    messageInterpolation: { parameter: 'client_id' },
                }, errorContext))
            }

            const { trustEmail, trustPhone, identityType, fieldMapping, userInfoURL } = clients[client_id]
            const providerInfo = {
                name: identityType,
                trustEmail: strategyTrustInfo.trustEmail && trustEmail,
                trustPhone: strategyTrustInfo.trustPhone && trustPhone,
            }

            try {
                const response = await fetch(userInfoURL, {
                    maxRetries: 1,
                    abortRequestTimeout: 5000,
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Accept': 'application/json',
                    },
                })
                if (response.status !== 200) {
                    return done(new GQLError(ERRORS.AUTHORIZATION_FAILED, errorContext, [new Error('userInfo request was not successful')]))
                }
                const userProfile = await response.json()
                const user = await syncUser(req, userProfile, req.session.userType, providerInfo, fieldMapping)

                return done(null, user)
            } catch (err) {
                done(err)
            }

        })
    }

    getProviders () {
        return Object.values(this.#clients).map(clientInfo => clientInfo.identityType)
    }
}

module.exports = {
    OidcTokenUserInfoAuthStrategy,
}