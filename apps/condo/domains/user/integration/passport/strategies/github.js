// @ts-check
const { Strategy: GithubStrategy } = require('passport-github2')

const { AuthStrategy } = require('./types')

/** @implements AuthStrategy */
class GithubAuthStrategy {
    identityType = 'github'
    #options = {}
    #callbackUrl = '/'
    #trustInfo = { trustEmail: false, trustPhone: false }

    constructor (routes, trustInfo, options) {
        const { callbackUrl } = routes
        this.#options = options
        this.#callbackUrl = callbackUrl
        this.#trustInfo = trustInfo
    }

    build (keystone) {
        const identityType = this.identityType

        return new GithubStrategy(
            {
                ...this.#options,
                callbackURL: this.#callbackUrl,
                scope: ['user:email'],
                // NOTE: This enables ability to pass request arguments from user input. We need to receive userType
                passReqToCallback: true,
            },
            async function githubAuthCallback (req, accessToken, refreshToken, profile, done) {
                throw new Error('IMPLEMENT ME')
            }
        )
    }

    getProviders () {
        return [this.identityType]
    }
}

module.exports = {
    GithubAuthStrategy,
}