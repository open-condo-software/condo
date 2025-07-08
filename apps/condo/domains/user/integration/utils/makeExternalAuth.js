const passport = require('passport')
const { Strategy: GithubStrategy } = require('passport-github2')
const { Strategy: OAuth2Strategy } = require('passport-oauth2')

const conf = require('@open-condo/config')

const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')

const VALID_USER_TYPES = [RESIDENT, STAFF]
const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'user-external-identity-middleware' } }

function makeExternalAuth (app, keystone, oidcProvider) {
    if (!oidcProvider) {
        throw new Error('Missing OIDC provider')
    }

    app.use(passport.initialize())

    const getOrCreateUser = async (userProfile, userType, identityType) => {
        let user
        const context = await keystone.createContext({ skipAccessControl: true })
        let userExternalIdentity = await UserExternalIdentity.getOne(context, {
            identityId: userProfile.id, userType, deletedAt: null,
        }, 'user { id }')

        if (!userExternalIdentity) {
            const exisingUserSearch = { deletedAt: null, userType }
            if (userProfile.phone) {
                exisingUserSearch.phone = userProfile.phone
            } else {
                exisingUserSearch.email = userProfile.email
            }

            const existingUser = await User.getOne(context, exisingUserSearch)
            if (existingUser) {
                user = existingUser
            } else {
                delete exisingUserSearch.deletedAt

                const userCreateData = {
                    isEmailVerified: false,
                    isAdmin: false,
                    isSupport: false,
                    ...DV_AND_SENDER,
                    ...existingUser,
                }

                if (userProfile.name) {
                    userCreateData.name = userProfile.name
                }

                user = await User.create(context, userCreateData)
            }

            await UserExternalIdentity.create(context, {
                identityId: userProfile.id,
                user: { connect: { id: user.id } },
                identityType,
                userType,
                ...DV_AND_SENDER,
            })
        } else {
            user = userExternalIdentity.user
        }

        return user
    }

    const captureUserType = async (req, res, next) => {
        const { userType } = req.query

        if (!userType) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'The userType query parameter is required.',
            })
        }

        if (!VALID_USER_TYPES.includes(userType)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `Valid user types are ${VALID_USER_TYPES.join(', ')}`,
            })
        }

        req.userType = userType
        next()
    }

    const onAuthSuccess = (oidcClientId) => async (req, res) => {
        const user = req.user
        if (!user) {
            return res.status(401).json({ error: 'Authentication failed', message: 'User not found after authentication' })
        }

        const clientId = oidcClientId

        try {
            const grant = new oidcProvider.Grant({
                accountId: user.id,
                clientId,
            })

            grant.addOIDCScope('openid')

            const grantId = await grant.save()

            const accessToken = new oidcProvider.AccessToken({
                accountId: user.id,
                clientId,
                grantId,
                scope: 'openid',
            })

            const token = await accessToken.save()

            return res.status(200).json({
                accessToken: token,
                tokenType: 'Bearer',
                expiresIn: accessToken.expiration,
                scope: 'openid',
            })

        } catch (e) {
            return res.status(500).json({ error: 'Token issue failure', message: 'Could not issue OIDC access token' })
        }
    }

    if (conf['PASSPORT_OAUTH']) {
        const oauthConfig = JSON.parse(conf['PASSPORT_OAUTH'])

        oauthConfig.forEach(config => {
            const strategy = {
                authorizationURL: config.authorizationURL,
                tokenURL: config.tokenURL,
                clientID: config.clientID,
                clientSecret: config.clientSecret,
                callbackURL: config.callbackURL,
                passReqToCallback: true,
            }
            passport.use(config.name, new OAuth2Strategy(
                strategy,
                async (req, accessToken, refreshToken, profile, done) => {
                    const userType = req.userType
                    try {
                        const profileResponse = await fetch(strategy.profileURL, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                            },
                        })

                        const userProfile = await profileResponse.json()

                        const { id, email, phone } = userProfile

                        // required at least to fields - id and phone/email to fully indentify user
                        if (!id || (!email && !phone)) {
                            return done(new Error('OAuth profile url did not return a user ID and at least one of: email, phone.'))
                        }

                        const user = await getOrCreateUser(userProfile, userType, config.name)

                        return done(null, user)
                    } catch (e) {
                        done(new Error('Failed to fetch user profile'))
                    }
                }
            ))

            app.get(`/auth/oauth/${config.name}`, captureUserType, passport.authenticate(config.name, { session: false }))
            app.get(
                `/auth/oauth/${config.name}/callback`,
                passport.authenticate(config.name, { session: false, failureRedirect: '/?error=oauth_fail' }),
                onAuthSuccess(config.name)
            )
        })


    }

    if (conf['PASSPORT_GITHUB']) {
        const githubConfig = JSON.parse(conf['PASSPORT_GITHUB'])

        passport.use(new GithubStrategy({
            clientID: githubConfig.clientId,
            clientSecret: githubConfig.clientSecret,
            callbackURL: githubConfig.callbackUrl,
            scope: ['user:email'],
            // This enables ability to pass request arguments from user input. We need to receive userType
            passReqToCallback: true,
        }, async (req, accessToken, refreshToken, profile, done) => {
            try {
                const userProfile = {
                    id: profile.id,
                    email: profile.emails[0].value,
                }
                const user = await getOrCreateUser(userProfile, req.userType, 'github')

                return done(null, user)
            } catch (error) {
                done(error)
            }
        }))

        app.get('/auth/github', captureUserType, passport.authenticate('github', { scope: [ 'user:email' ], session: false }))
        app.get('/auth/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/?error=github_fail' }), onAuthSuccess('github'))
    }

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser(async (id, done) => {
        const context = await keystone.createContext({ skipAccessControl: true })
        const user = await User.getOne(context, { id })
        done(null, user)
    })
}

module.exports = { makeExternalAuth }
