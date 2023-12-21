const epochTime = require('oidc-provider/lib/helpers/epoch_time')
const JWT = require('oidc-provider/lib/helpers/jwt')

const conf = require('@open-condo/config')

const createConfiguration = require('./configuration')
const initializeKeystore = require('./initializeKeystore')


let HELPER_INSTANCE

class LaunchB2BAppHelpers {
    #keystore

    config
    jwksResponse

    constructor () {
        const config = createConfiguration(conf)
        const { keystore, jwksResponse } = initializeKeystore(config.jwks)

        this.config = config
        this.#keystore = keystore
        this.jwksResponse = jwksResponse
    }

    /**
     *
     * @return {LaunchB2BAppHelpers}
     */
    static getInstance () {
        if (!HELPER_INSTANCE) {
            HELPER_INSTANCE = new LaunchB2BAppHelpers()
        }
        return HELPER_INSTANCE
    }

    async signLaunchParams (appId, appUrl, userId, orgId) {
        const [jwk] = this.#keystore.selectForSign({ alg: this.config.alg, use: this.config.use })
        const key = await this.#keystore.getKeyObject(jwk, this.config.alg)

        const iat = epochTime()
        const exp = iat + this.config.ttl

        const payload = {
            // Launch params of miniapp
            userId: userId,
            organizationId: orgId,

            // Extra params
            appId: appId,
            appUrl: appUrl,

            // Required params
            exp: exp, // It indicates the expiration date of a JWT
            iat: iat, // It indicates when the JWT has been issued
            nbf: iat, // It indicates the point in time when the JWT becomes valid
            iss: this.config.serverUrl, // It indicates the identity of the party that issued the JWT
            aud: appId, // It indicates for whom the token is intended
            sub: userId, // It indicates whom the token refers to. This property is used in the oidc provider, so we also pass it so that it is not empty
        }

        const options = {
            type: 'JWT',
            fields: { kid: jwk.kid },
        }

        return await JWT.sign(payload, key, this.config.alg, options)
    }
}

module.exports = LaunchB2BAppHelpers
