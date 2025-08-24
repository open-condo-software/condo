// @ts-check
const { Strategy: OIDCStrategy } = require('passport-openidconnect')

const { syncUser } = require('@condo/domains/user/integration/passport/utils/user')

const { AuthStrategy } = require('./types')

/** @implements AuthStrategy */
class OIDCAuthStrategy {
    #identityType
    #options = {}
    #trustInfo = { trustEmail: false, trustPhone: false }
    #callbackURL
    #fieldMapping = {}

    constructor (strategyConfig, routes) {
        const { name, options, trustEmail, trustPhone } = strategyConfig
        const { identityType, fieldMapping, ...strategyOptions } = options
        const { callbackURL } = routes

        this.#options = strategyOptions
        this.#trustInfo = { trustEmail, trustPhone }
        this.#identityType = identityType || name
        this.#callbackURL = callbackURL
        if (fieldMapping) {
            this.#fieldMapping = fieldMapping
        }
    }


    build () {
        const providerInfo = {
            ...this.#trustInfo,
            name: this.#identityType,
        }

        const fieldMapping = this.#fieldMapping

        return new OIDCStrategy(
            {
                ...this.#options,
                passReqToCallback: true,
                callbackURL: this.#callbackURL,
            },
            // NOTE: Important to have all args. Otherwise _json is not available
            async function oidcAuthCallback (req, issuer, uiProfile, idProfile, context, idToken, accessToken, refreshToken, params, done) {
                try {
                    const user = await syncUser(req, uiProfile._json, req.session.userType, providerInfo, fieldMapping)
                    done(null, user)
                } catch (err) {
                    done(err)
                }
            }
        )
    }

    getProviders () {
        return [this.#identityType]
    }
}

module.exports = {
    OIDCAuthStrategy,
}