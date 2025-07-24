const passport = require('passport')
const { z } = require('zod')

const conf = require('@open-condo/config')

const { User } = require('@condo/domains/user/utils/serverSchema')

const { KNOWN_STRATEGIES } = require('./strategies')
const { passportConfigSchema } = require('./utils/config')

/** @type PassportAuthRouter */
let _globalRouter = null

class PassportAuthRouter {
    #strategiesByNames = {}
    apiPrefix = '/api/auth'

    constructor (config) {
        const result = passportConfigSchema.safeParse(config)
        if (!result.success) {
            throw new Error(`invalid passport config\n ${z.prettifyError(result.error)}`)
        }

        for (const { strategy, options, name, trustEmail, trustPhone } of result.data) {
            if (Object.hasOwn(this.#strategiesByNames, name)) {
                throw new Error(`passport handler with "${name}" name was already registered`)
            }
            if (!Object.hasOwn(KNOWN_STRATEGIES, strategy)) {
                throw new Error(`unknown passport strategy: "${strategy}"`)
            }
            const Strategy = KNOWN_STRATEGIES[strategy]
            const trustInfo = { trustPhone, trustEmail }
            const routes = this.generateRoutesByName(name)
            this.#strategiesByNames[name] = new Strategy(routes, trustInfo, options)
        }
    }

    generateRoutesByName (name) {
        return {
            authUrl: `${this.apiPrefix}/${name}`,
            callbackUrl: `${this.apiPrefix}/${name}/callback`,
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

        app.get(`${this.apiPrefix}/:provider`, (req, res, next) => {
            const { provider } = req.params
            if (!this.#strategiesByNames.hasOwnProperty(provider)) return res.status(404).json({ error: 'unknown provider' })

            passport.authenticate(provider)(req, res, next)
        })
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