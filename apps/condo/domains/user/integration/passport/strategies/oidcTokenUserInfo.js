// @ts-check
const { Strategy: CustomStrategy } = require('passport-custom')

const { fetch } = require('@open-condo/keystone/fetch')

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
            if (!access_token) {
                return done(new Error('access_token was not provided'))
            }
            if (typeof access_token !== 'string') {
                return done(new Error('invalid access_token'))
            }
            if (!client_id) {
                return done(new Error('client_id was not provided'))
            }
            if (typeof client_id !== 'string' || !Object.hasOwn(clients, client_id)) {
                return done(new Error('invalid access_token'))
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
                    return done(new Error('userInfo request was not successful'))
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