const bodyParser = require('body-parser')
const express = require('express')
const passport = require('passport')
const { Strategy: GithubStrategy } = require('passport-github2')
const { Strategy: OAuth2Strategy } = require('passport-oauth2')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { expressErrorHandler } = require('@open-condo/keystone/logging/expressErrorHandler')

const { SbbolRoutes } = require('@condo/domains/organization/integrations/sbbol/routes')
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const { AppleIdRoutes } = require('@condo/domains/user/integration/appleid/routes')
const { SberIdRoutes } = require('@condo/domains/user/integration/sberid/routes')
const createOidcConfiguration = require('@condo/domains/user/oidc/configuration')
const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')

const VALID_USER_TYPES = [RESIDENT, STAFF]

function makeExternalAuth (app, keystone, oidcProvider) {
    if (!oidcProvider) {
        throw new Error('Missing OIDC provider')
    }

    app.use(passport.initialize())
    // app.use(passport.session())

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
            console.error('Authentication succeeded, but no user object was found.')
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
            console.error(e)
            return res.status(500).json({ error: 'Token issue failure', message: 'Could not issue OIDC access token' })
        }

        // try {
        //     const session = new oidcProvider.Session({
        //         accountId: user.id,
        //         jti: uuid(),
        //     })
        //     const cookieValue = await session.save(60 * 60 * 24)
        //
        //     // const { name, ...cookieOptions } = oidcProvider.configuration.cookies.long
        //     res.cookie('_session', cookieValue, {})
        //
        //     res.redirect('/')
        // } catch (e) {
        //     console.error('Failed to start oidc session', e)
        //     res.status(500).json({ error: 'Failed to start oidc session', message: e })
        // }


        // try {
        //     const grant = new oidcProvider.Grant({
        //         accountId: user.id,
        //         clientId: oidcClientId,
        //     })
        //     grant.addOIDCScope('openid')
        //     const grantId = await grant.save()
        //
        //     const result = { login: { accountId: user.id }, consent: { grantId } }
        //
        //
        //     const token = await oidcProvider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
        //
        //     res.status(200).json({ token })
        // } catch (error) {
        //     return res.status(400).json({
        //         error: 'Bad Request',
        //         message: error,
        //     })
        // }

        // const appToken = await keystone._sessionManager.startAuthedSession(req, {
        //     item: { id: user.id },
        //     list: keystone.lists['User'],
        // })
        //
        // res.status(200).json({ appToken })
    }

    // if (conf['PASSPORT_CUSTOM']) {
    //     const customConfig = JSON.parse(conf['PASSPORT_CUSTOM'])
    //     customConfig.forEach(({ url, secret, name }) => {
    //         passport.use(name, new CustomStrategy(async (req, done) => {
    //             try {
    //                 const authHeader = req.headers['authorization'] || req.headers['Authorization']
    //                 if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //                     return done(null, false, { message: 'Missing or invalid Authorization header' })
    //                 }
    //
    //                 const token = authHeader.split('Bearer ')[1]
    //                 if (token !== secret) {
    //                     return done(null, false, { message: 'Invalid access token' })
    //                 }
    //
    //                 const { email, name, userType } = req.body
    //                 if (!email || !name || !userType) {
    //                     return done(null, false, { message: 'Request body must contain user email, name and userType' })
    //                 }
    //
    //                 if (!VALID_USER_TYPES.includes(userType)) {
    //                     return done(null, false, { message: `Wrong userType. Valid user types are ${VALID_USER_TYPES.join(', ')}` })
    //                 }
    //
    //                 const context = await keystone.createContext({ skipAccessControl: true })
    //
    //                 let user
    //                 let userExternalIdentity = await UserExternalIdentity.getOne(context, {
    //
    //                     userType, deletedAt: null,
    //                 })
    //
    //             } catch (e) {
    //                 console.error(e)
    //             }
    //         }))
    //     })
    // }

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
                    console.log(profile)

                }
            ))

            app.get('/auth/oauth', captureUserType, passport.authenticate(config.name, { session: false }))
            app.get(
                '/auth/oauth/callback',
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
                const userType = req.userType
                const context = await keystone.createContext({ skipAccessControl: true })
                let user
                let userExternalIdentity = await UserExternalIdentity.getOne(context, { identityId: profile.id, userType, deletedAt: null }, 'user { id }')
                if (!userExternalIdentity) {
                    const email = profile.emails[0].value
                    // Check for user already exists with that email
                    const existedUser = await User.getOne(context, {
                        email,
                        type: userType,
                        deletedAt: null,
                    })
                    if (existedUser) {
                        user = existedUser
                    } else {
                        user = await User.create(context, {
                            email, type: userType,
                            isEmailVerified: false,
                            isAdmin: false, isSupport: false,
                            dv: 1, sender: { dv: 1, fingerprint: 'github-external-identity' },
                        })
                    }

                    await UserExternalIdentity.create(context, {
                        identityId: profile.id,
                        user: { connect: { id: user.id } },
                        identityType: 'github',
                        userType: userType,
                        dv: 1, sender: { dv: 1, fingerprint: 'github-external-identity' },
                    })
                } else {
                    user = userExternalIdentity.user
                }
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

class UserExternalIdentityMiddleware {
    async prepareMiddleware ({ keystone }) {
        // all bellow routes are handling csrf properly
        // and controlling start/end authorization sources (browsers, mobile clients, etc)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        // sbbol route
        const sbbolRoutes = new SbbolRoutes()
        app.get('/api/sbbol/auth', sbbolRoutes.startAuth.bind(sbbolRoutes))
        app.get('/api/sbbol/auth/callback', sbbolRoutes.completeAuth.bind(sbbolRoutes))

        // apple_id route
        const appleIdRoutes = new AppleIdRoutes()
        app.get('/api/apple_id/auth', appleIdRoutes.startAuth.bind(appleIdRoutes))
        app.get('/api/apple_id/auth/callback', appleIdRoutes.completeAuth.bind(appleIdRoutes))
        app.post('/api/apple_id/auth/callback', appleIdRoutes.completeAuth.bind(appleIdRoutes))

        // sber_id route
        const sberIdRoutes = new SberIdRoutes()
        app.get('/api/sber_id/auth', sberIdRoutes.startAuth.bind(sberIdRoutes))
        app.get('/api/sber_id/auth/callback', sberIdRoutes.completeAuth.bind(sberIdRoutes))

        const Provider = require('oidc-provider')
        const oidcProvider = new Provider(conf.SERVER_URL, createOidcConfiguration(keystone, conf))

        makeExternalAuth(app, keystone, oidcProvider)

        // error handler
        // app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    UserExternalIdentityMiddleware,
}
