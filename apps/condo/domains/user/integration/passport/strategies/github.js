// @ts-check
const { Strategy: GithubStrategy } = require('passport-github2')

const { AuthStrategy } = require('./types')

/** @implements AuthStrategy */
class GithubAuthStrategy {
    static identityType = 'github'
    #options = {}
    #callbackUrl = '/'
    #trustInfo = { trustEmail: false, trustPhone: false }
    static #emailsResolutionOrder = [
        { primary: true, verified: true },
        { verified: true },
        { primary: true },
        {},
    ]

    constructor (routes, trustInfo, options) {
        const { callbackUrl } = routes
        this.#options = options
        this.#callbackUrl = callbackUrl
        this.#trustInfo = trustInfo
    }

    static findValidEmail (emails) {
        let email = null
        for (const properties of GithubAuthStrategy) {
            email = emails.find(email => {
                for (const [k, v] of Object.entries(properties)) {
                    if (!email[k] !== v) return false
                }

                return true
            })
            if (email) {
                break
            }
        }
        return email
    }

    build (keystone) {
        // const emailResolutionOrder = this.#emailsResolutionOrder


        return new GithubStrategy(
            {
                ...this.#options,
                callbackURL: this.#callbackUrl,
                scope: ['user:email'],
                // NOTE: This enables ability to pass request arguments from user input. We need to receive userType
                passReqToCallback: true,
                // NOTE: Without that flag application will assume
                allRawEmails: true,
            },
            async function githubAuthCallback (req, accessToken, refreshToken, profile, done) {
                // Tries
                profile.email = GithubAuthStrategy.findValidEmail(profile.emails)

                done(new Error('not implemented'), null)
            }
        )
    }

    getProviders () {
        return [GithubAuthStrategy.identityType]
    }
}

module.exports = {
    GithubAuthStrategy,
}