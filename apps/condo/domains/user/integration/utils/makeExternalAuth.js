const Ajv = require('ajv')
const { omit, get } = require('lodash')
const passport = require('passport')
const { Strategy: GithubStrategy } = require('passport-github2')
const { Strategy: OAuth2Strategy } = require('passport-oauth2')
const { Strategy: OIDCStrategy } = require('passport-openidconnect')

const conf = require('@open-condo/config')

const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')

const VALID_USER_TYPES = [RESIDENT, STAFF]
const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'user-external-identity-middleware' } }

const ajv = new Ajv()
const oidcConfigSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            authorizationURL: { type: 'string' },
            tokenURL: { type: 'string' },
            userInfoURL: { type: 'string' },
            clientID: { type: 'string' },
            clientSecret: { type: 'string' },
            callbackURL: { type: 'string' },
            name: { type: 'string' },
            isPhoneTrusted: { type: 'boolean' },
            isEmailTrusted: { type: 'boolean' },
        },
        required: [
            'authorizationURL',
            'tokenURL',
            'userInfoURL',
            'clientID',
            'clientSecret',
            'callbackURL',
            'name',
            'isPhoneTrusted',
            'isEmailTrusted',
        ],
    },
}
const githubConfigSchema = {
    'type': 'object',
    'properties': {
        'clientId': { 'type': 'string' },
        'clientSecret': { 'type': 'string' },
        'callbackUrl': { 'type': 'string' },
        'name': { 'type': 'string' },
        'isEmailTrusted': { 'type': 'boolean' },
    },
    'required': [
        'clientId',
        'clientSecret',
        'callbackUrl',
        'name',
        'isEmailTrusted',
    ],

}

function makeExternalAuth (app, keystone, oidcProvider) {
    if (!oidcProvider) {
        throw new Error('Missing OIDC provider')
    }

    app.use(passport.initialize())

    async function getOrCreateUser (userProfile, userType, identityType, config) {
        const context = await keystone.createContext({ skipAccessControl: true })
        const isPhoneTrusted = get(config, 'isPhoneTrusted', false)
        const isEmailTrusted = get(config, 'isEmailTrusted', false)
        const { phone, email } = userProfile
        const userMeta = {
            phone: get(userProfile, 'phone', null),
            email: get(userProfile, 'email', null),
            provider: identityType,
        }
        let user
        let existingUser

        let userExternalIdentity = await UserExternalIdentity.getOne(context, {
            identityId: userProfile.id, userType, deletedAt: null,
        }, 'user { id }')

        if (!userExternalIdentity) {
            const existingUserSearch = {
                deletedAt: null,
                type: userType,
                isAdmin: false,
                isSupport: false,
            }

            if (phone) {
                if (isPhoneTrusted) {
                    existingUser = await User.getOne(context, {
                        ...existingUserSearch, phone, isPhoneVerified: true,
                    })

                    if (existingUser) {
                        user = existingUser
                    } else {
                        user = await User.create(context, {
                            ...omit(existingUserSearch, 'deletedAt'),
                            phone, isPhoneVerified: true, isEmailVerified: false,
                            meta: userMeta,
                            ...DV_AND_SENDER,
                        })
                    }
                } else {
                    existingUser = await User.getOne(context, {
                        ...existingUserSearch,
                        phone,
                    })
                    const userCreatePayload = {
                        ...omit(existingUserSearch, 'deletedAt'),
                        isPhoneVerified: false, isEmailVerified: false,
                        meta: userMeta,
                        ...DV_AND_SENDER,
                    }

                    if (!existingUser) {
                        userCreatePayload.phone = phone
                    }

                    user = await User.create(context, userCreatePayload)
                }

            } else if (email) {
                if (isEmailTrusted) {
                    existingUser = await User.getOne(context, {
                        ...existingUserSearch, email, isEmailVerified: true,
                    })

                    if (existingUser) {
                        user = existingUser
                    } else {
                        user = await User.create(context, {
                            ...omit(existingUserSearch, 'deletedAt'),
                            email, isPhoneVerified: false, isEmailVerified: true,
                            meta: userMeta,
                            ...DV_AND_SENDER,
                        })
                    }
                } else {
                    existingUser = await User.getOne(context, {
                        ...existingUserSearch,
                        email,
                    })
                    const userCreatePayload = {
                        ...omit(existingUserSearch, 'deletedAt'),
                        isPhoneVerified: false, isEmailVerified: false,
                        meta: userMeta,
                        ...DV_AND_SENDER,
                    }

                    if (!existingUser) {
                        userCreatePayload.email = email
                    }

                    user = await User.create(context, userCreatePayload)
                }
            } else {
                user = await User.create(context, {
                    ...omit(existingUserSearch, 'deletedAt'),
                    isEmailVerified: false,
                    isPhoneVerified: false,
                    meta: userMeta,
                    ...DV_AND_SENDER,
                })
            }

            await UserExternalIdentity.create(context, {
                identityId: userProfile.id,
                user: { connect: { id: user.id } },
                identityType,
                userType,
                meta: userMeta,
                ...DV_AND_SENDER,
            })
        } else {
            user = userExternalIdentity.user
        }

        return user
    }

    async function captureUserType (req, res, next) {
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
        req.session.userType = userType
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

    // TODO: maybe we don't need this option of auth flow at the MVP.
    //  So maybe we cat drop this for a moment
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
                    const userType = req.userType || req.session.userType
                    try {
                        const profileResponse = await fetch(strategy.profileURL, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                            },
                            method: 'GET',
                        })

                        const userProfile = await profileResponse.json()

                        const { id, email, phone } = userProfile

                        // required at least to fields - id and phone/email to fully indentify user
                        if (!id || (!email && !phone)) {
                            return done(new Error('OAuth profile url did not return a user ID and at least one of: email, phone.'))
                        }

                        const user = await getOrCreateUser(userProfile, userType, config.name, config)

                        return done(null, user)
                    } catch (error) {
                        done(new Error('Failed to fetch user profile'))
                    }
                }
            ))

            app.get(`/api/${config.name}/auth`, captureUserType, passport.authenticate(config.name, { session: false }))
            app.get(
                `/api/${config.name}/auth/callback`,
                passport.authenticate(config.name, { session: false, failureRedirect: '/?error=oauth_fail' }),
                onAuthSuccess(config.name)
            )
        })
    }

    if (conf['PASSPORT_OIDC']) {
        const oidcConfig = JSON.parse(conf['PASSPORT_OIDC'])
        const validateConfig = ajv.compile(oidcConfigSchema)
        const configValid = validateConfig(oidcConfig)
        if (!configValid) {
            throw new Error(`OIDC config validation failed ${validateConfig.errors}`)
        }

        oidcConfig.forEach(config => {
            const strategy = {
                issuer: config.serverURL,
                authorizationURL: config.authorizationURL,
                tokenURL: config.tokenURL,
                userInfoURL: config.userInfoURL,
                clientID: `${config.clientID}`,
                clientSecret: config.clientSecret,
                callbackURL: config.callbackURL,
                scope: config.scope,
                passReqToCallback: true,
            }

            passport.use(config.name, new OIDCStrategy(
                strategy,
                async (req, issuer, uiProfile, idProfile, context, idToken, accessToken, refreshToken, params, done) => {
                    const profile = uiProfile._json
                    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null
                    if (!email) {
                        return done(new Error('OIDC email address required'))
                    }

                    const userType = req.userType || req.session.userType
                    try {
                        const user = await getOrCreateUser(
                            { id: profile.id, email },
                            userType, config.name, config
                        )

                        return done(null, user)
                    } catch (error) {
                        done(error)
                    }
                }
            ))

            app.get(`/api/${config.name}/auth`, captureUserType, passport.authenticate(config.name, { session: false }))
            app.get(
                `/api/${config.name}/auth/callback`,
                passport.authenticate(config.name, { session: false, failureRedirect: '/?error=openid_fail' }),
                onAuthSuccess(config.name)
            )
        })
    }

    if (conf['PASSPORT_GITHUB']) {
        const githubConfig = JSON.parse(conf['PASSPORT_GITHUB'])
        const validateConfig = ajv.compile(githubConfigSchema)
        const configValid = validateConfig(githubConfig)
        if (!configValid) {
            throw new Error(`Github config validation failed ${validateConfig.errors}`)
        }

        passport.use(new GithubStrategy({
            clientID: githubConfig.clientId,
            clientSecret: githubConfig.clientSecret,
            callbackURL: githubConfig.callbackUrl,
            scope: ['user:email'],
            // This enables ability to pass request arguments from user input. We need to receive userType
            passReqToCallback: true,
        }, async (req, accessToken, refreshToken, profile, done) => {
            const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null
            if (!email) {
                return done(new Error('Github email address required'))
            }
            const userType = req.userType || req.session.userType

            try {
                const user = await getOrCreateUser(
                    { id: profile.id, email },
                    userType,
                    'github',
                    githubConfig,
                )

                return done(null, user)
            } catch (error) {
                done(error)
            }
        }))

        app.get('/api/github/auth', captureUserType, passport.authenticate('github', { scope: [ 'user:email' ], session: false }))
        app.get('/api/github/auth/callback', passport.authenticate('github', { session: false, failureRedirect: '/?error=github_fail' }), onAuthSuccess('github'))
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
