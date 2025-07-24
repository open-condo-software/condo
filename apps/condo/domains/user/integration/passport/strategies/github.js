// @ts-check
const { Strategy: GithubStrategy } = require('passport-github2')

const { syncUser } = require('@condo/domains/user/integration/passport/utils/user')

const { AuthStrategy } = require('./types')

/** @implements AuthStrategy */
class GithubAuthStrategy {
    static identityType = 'github'
    static fieldMapping = {
        id: 'id',
        email: 'email.value',
        isEmailVerified: 'email.verified',
        name: 'username',
    }
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
        let foundEmail = null
        for (const properties of GithubAuthStrategy.#emailsResolutionOrder) {
            foundEmail = emails.find(email => {
                for (const [k, v] of Object.entries(properties)) {
                    if (email[k] !== v) return false
                }

                return true
            })
            if (foundEmail) {
                break
            }
        }
        return foundEmail
    }

    build (keystone) {
        const providerInfo = {
            name: GithubAuthStrategy.identityType,
            ...this.#trustInfo,
        }


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
                // Tries to find best of linked emails
                profile.email = GithubAuthStrategy.findValidEmail(profile.emails)

                try {
                    const user = await syncUser(keystone, profile, req.session.userType, providerInfo, GithubAuthStrategy.fieldMapping)
                    done(null, user)
                } catch (err) {
                    done(err)
                }
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