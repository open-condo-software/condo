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
    #callbackURL = '/'
    #trustInfo = { trustEmail: false, trustPhone: false }
    static #emailsResolutionOrder = [
        { primary: true, verified: true },
        { verified: true },
        { primary: true },
        {},
    ]

    constructor (strategyConfig, routes) {
        const { options, trustEmail, trustPhone } = strategyConfig
        const { callbackURL } = routes
        this.#options = options
        this.#callbackURL = callbackURL
        this.#trustInfo = { trustEmail, trustPhone }
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

    build () {
        const providerInfo = {
            name: GithubAuthStrategy.identityType,
            ...this.#trustInfo,
        }

        const clientID = this.#options.clientID


        return new GithubStrategy(
            {
                ...this.#options,
                callbackURL: this.#callbackURL,
                scope: ['user:email'],
                // NOTE: This enables ability to pass request arguments from user input. We need to receive userType
                passReqToCallback: true,
                // NOTE: Without that flag application will only set primary email and omit verification status
                allRawEmails: true,
            },
            async function githubAuthCallback (req, accessToken, refreshToken, profile, done) {
                // Tries to find best of linked emails
                profile.email = GithubAuthStrategy.findValidEmail(profile.emails)

                try {
                    const user = await syncUser(req, profile, req.session.userType, providerInfo, GithubAuthStrategy.fieldMapping)
                    done(null, user, { accessToken, refreshToken, clientID, provider: providerInfo.name })
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