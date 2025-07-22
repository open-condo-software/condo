// @ts-check
const { Strategy: GithubStrategy } = require('passport-github2')

const { AuthStrategy } = require('./types')

/** @implements AuthStrategy */
class GithubAuthStrategy {
    identityType = 'github'
    #options = {}
    #callbackUrl = '/'

    constructor (routes, options) {
        const { callbackUrl } = routes
        this.#options = options
        this.#callbackUrl = callbackUrl
    }

    build (keystone) {
        return new GithubStrategy(
            {
                ...this.#options,
                callbackURL: this.#callbackUrl,
                scope: ['user:email'],
                // NOTE: This enables ability to pass request arguments from user input. We need to receive userType
                passReqToCallback: true,
            },
            async function githubAuthCallback (req, accessToken, refreshToken, profile, done) {

            }
        )
    }

    getProviders () {
        return [this.identityType]
    }
}