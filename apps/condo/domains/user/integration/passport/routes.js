const passport = require('passport')
const { z } = require('zod')

const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')
const { wrapWithGQLError } = require('@open-condo/keystone/utils/errors/wrapWithGQLError')

const { User } = require('@condo/domains/user/utils/serverSchema')

const { ERRORS } = require('./errors')
const { KNOWN_STRATEGIES } = require('./strategies')
const { passportConfigSchema } = require('./utils/config')
const { checkAuthRateLimits } = require('./utils/routes')
const { captureUserType, ensureUserType } = require('./utils/user')

const authInfoSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    provider: z.string(),
    clientID: z.string(),
}).partial()

/** @type PassportAuthRouter */
let _globalRouter = null

class PassportAuthRouter {
    #strategiesByNames = {}
    apiPrefix = '/api/auth'

    constructor (config) {
        const { success, data: parsedConfig, parseError } = passportConfigSchema.safeParse(config)
        if (!success) {
            throw new Error(`invalid passport config\n ${z.prettifyError(parseError)}`)
        }

        for (const strategyConfig of parsedConfig) {
            const { name, strategy } = strategyConfig
            if (Object.hasOwn(this.#strategiesByNames, name)) {
                throw new Error(`passport handler with "${name}" name was already registered`)
            }
            if (!Object.hasOwn(KNOWN_STRATEGIES, strategy)) {
                throw new Error(`unknown passport strategy: "${strategy}"`)
            }
            const Strategy = KNOWN_STRATEGIES[strategy]
            const routes = this.generateRoutesByName(name)
            this.#strategiesByNames[name] = new Strategy(strategyConfig, routes)
        }
    }

    static onAuthFail (err, req, res, next) {
        const gqlErr = wrapWithGQLError(err, { req }, ERRORS.AUTHORIZATION_FAILED)
        next(gqlErr)
    }

    generateRoutesByName (name) {

        return {
            authURL: new URL(`${this.apiPrefix}/${name}`, conf['SERVER_URL']).toString(),
            callbackURL: new URL(`${this.apiPrefix}/${name}/callback`, conf['SERVER_URL']).toString(),
        }
    }

    addPassportRoutes (app, keystone) {
        app.use(passport.initialize())

        passport.serializeUser((user, done) => done(null, user.id))
        passport.deserializeUser(async (id, done) => {
            const context = await keystone.createContext({ skipAccessControl: true })
            const user = await User.getOne(context, { id })
            const err = user ? null : new Error('invalid user id to deserialize')
            return done(err, user)
        })

        for (const [name, strategy] of Object.entries(this.#strategiesByNames)) {
            passport.use(name, strategy.build())
        }

        const strategies = this.#strategiesByNames
        function authenticate (req, res, next) {
            const { provider } = req.params
            if (!provider || !strategies.hasOwnProperty(provider)) {
                return next(new GQLError({ ...ERRORS.UNKNOWN_PROVIDER, messageInterpolation: { provider } }, { req }))
            }

            passport.authenticate(provider)(req, res, next)
        }

        async function onAuthSuccess (req, res, next) {
            const user = req.user

            if (!user || !user.id || typeof user.id !== 'string') {
                return next(new GQLError(ERRORS.AUTHORIZATION_FAILED, { req }))
            }

            const { success: isValidAuthInfo, data: authInfo, error: authInfoError } = authInfoSchema.safeParse(req.authInfo || {})
            if (!isValidAuthInfo) {
                return next(new GQLError(ERRORS.INVALID_AUTH_INFO, { req }, [authInfoError]))
            }

            try {
                await keystone._sessionManager.startAuthedSession(req, {
                    item: { id: user.id },
                    list: keystone.lists['User'],
                    meta: {
                        source: 'passport',
                        provider: authInfo.provider || req.params.provider,
                        clientID: authInfo.clientID,
                    },
                })

                return res.redirect('/')
            } catch (err) {
                next(err)
            }
        }

        app.get(
            `${this.apiPrefix}/:provider`,
            captureUserType,
            authenticate,
            PassportAuthRouter.onAuthFail,
        )
        app.get(
            `${this.apiPrefix}/:provider/callback`,
            ensureUserType,
            checkAuthRateLimits,
            authenticate,
            onAuthSuccess,
            PassportAuthRouter.onAuthFail,
        )
    }

    getIdentityProviders () {
        const providers = []

        for (const strategy of Object.values(this.#strategiesByNames)) {
            providers.push(...strategy.getProviders())
        }

        return providers
    }

    static init () {
        if (!_globalRouter) {
            _globalRouter = new PassportAuthRouter(JSON.parse(conf['PASSPORT_CONFIG'] || '[]'))
        }

        return _globalRouter
    }
}

module.exports = {
    PassportAuthRouter,
}