const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { Keystone } = require('@keystonejs/keystone')
const bodyParser = require('body-parser')
const cuid = require('cuid')
const identity = require('lodash/identity')
const nextCookie = require('next-cookies')
const { v4 } = require('uuid')

const conf = require('@open-condo/config')
const { formatError } = require('@open-condo/keystone/apolloErrorFormatter')
const { registerSchemas } = require('@open-condo/keystone/KSv5v6/v5/registerSchema')
const { getKeystonePinoOptions, GraphQLLoggerPlugin } = require('@open-condo/keystone/logging')
const { schemaDocPreprocessor, adminDocPreprocessor, escapeSearchPreprocessor, customAccessPostProcessor } = require('@open-condo/keystone/preprocessors')
const { registerTasks } = require('@open-condo/keystone/tasks')

const { internalGetAsyncLocalStorage, _internalGetExecutionContextAsyncLocalStorage} = require('../../executionContext')
const { parseCorsSettings } = require('../../cors.utils')
const { expressErrorHandler } = require('../../logging/expressErrorHandler')
const { prepareDefaultKeystoneConfig } = require('../../setup.utils')


const IS_BUILD = conf['DATABASE_URL'] === 'undefined'
const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'
// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'
// NOTE(pahaz): it's a magic number tested by @arichiv at https://developer.chrome.com/blog/cookie-max-age-expires/
const INFINITY_MAX_AGE_COOKIE = 1707195600

function prepareKeystone ({ onConnect, extendExpressApp, schemas, schemasPreprocessors, tasks, apps, lastApp, graphql, ui }) {
    // trying to be compatible with keystone-6 and keystone-5
    // TODO(pahaz): add storage like https://keystonejs.com/docs/config/config#storage-images-and-files

    if (!schemas) throw new Error('schemas argument is required')
    if (schemas && typeof schemas !== 'function') throw new Error('schemas should be a function like `() => [ Schema ]`')
    if (schemasPreprocessors && typeof schemasPreprocessors !== 'function') throw new Error('schemasPreprocessors should be a function like `() => [ preprocessor ]`')
    if (tasks && typeof tasks !== 'function') throw new Error('tasks should be a function like `() => [ Task ]`')
    if (apps && typeof apps !== 'function') throw new Error('apps should be a function like `() => [ App | Middleware ]`')

    _internalGetExecutionContextAsyncLocalStorage().enterWith( { prepareKeystone: { id: v4(), argv: process.argv, execArgv: process.execArgv } })

    const keystoneConfig = prepareDefaultKeystoneConfig(conf)
    const keystone = new Keystone({
        ...keystoneConfig,
        onConnect: async () => onConnect && onConnect(keystone),
    })

    const globalPreprocessors = schemasPreprocessors ? schemasPreprocessors() : []
    globalPreprocessors.push(...[schemaDocPreprocessor, adminDocPreprocessor, escapeSearchPreprocessor, customAccessPostProcessor])
    // We need to register all schemas as they will appear in admin ui
    registerSchemas(keystone, schemas(), globalPreprocessors)

    const authStrategy = keystone.createAuthStrategy({
        type: PasswordAuthStrategy,
        list: 'User',
        config: {
            protectIdentities: false,
        },
    })

    if (!IS_BUILD) {
        // Since tasks may require Redis connection, and Redis variable is not present during build time:
        // We need to register all tasks as they will be possible to execute
        if (tasks) registerTasks(tasks())
    }
    
    return {
        keystone,
        // NOTE(pahaz): please, check the `executeDefaultServer(..)` to understand how it works.
        // And you need to look at `keystone/lib/Keystone/index.js:602` it uses `{ origin: true, credentials: true }` as default value for cors!
        // Examples: https://expressjs.com/en/resources/middleware/cors.html or check `node_modules/cors/README.md`
        cors: (conf.CORS) ? parseCorsSettings(JSON.parse(conf.CORS)) : { origin: true, credentials: true },
        pinoOptions: getKeystonePinoOptions(),
        apps: [
            ...((apps) ? apps() : []),
            new GraphQLApp({
                apollo: {
                    formatError,
                    debug: IS_ENABLE_APOLLO_DEBUG,
                    introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                    playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                    plugins: [new GraphQLLoggerPlugin()],
                },
                ...(graphql || {}),
            }),
            new AdminUIApp({
                adminPath: '/admin',
                isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport)),
                authStrategy,
                ...(ui || {}),
            }),
            lastApp,
        ].filter(identity),

        /** @type {(app: import('express').Application) => void} */
        configureExpress: (app) => {

            // NOTE(pahaz): we are always behind reverse proxy
            app.set('trust proxy', true)

            // NOTE(toplenboren): we need a custom body parser for custom file upload limit
            app.use(bodyParser.json({ limit: '100mb', extended: true }))
            app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))

            const requestIdHeaderName = 'X-Request-Id'
            app.use(function reqId (req, res, next) {
                const reqId = req.headers[requestIdHeaderName.toLowerCase()] || v4()
                _internalGetExecutionContextAsyncLocalStorage().run({ request: { id: reqId } }, () => {
                    // we are expecting to receive reqId from client in order to have fully traced logs end to end
                    // also, property name are constant name, not a dynamic user input
                    // nosemgrep: javascript.express.security.audit.remote-property-injection.remote-property-injection
                    req['id'] = req.headers[requestIdHeaderName.toLowerCase()] = reqId
                    res.setHeader(requestIdHeaderName, reqId)
                    next()
                })
            })

            app.use('/admin/', (req, res, next) => {
                if (req.url === '/api') return next()
                const cookies = nextCookie({ req })
                if (!cookies['sender'] || !cookies['dv'] || !cookies['userId']) {
                    const fingerprint = cookies['userId'] || cuid()
                    res.cookie('sender', JSON.stringify({ fingerprint, dv: 1 }), { maxAge: INFINITY_MAX_AGE_COOKIE })
                    res.cookie('dv', 1, { maxAge: INFINITY_MAX_AGE_COOKIE })
                    res.cookie('userId', fingerprint, { maxAge: INFINITY_MAX_AGE_COOKIE })
                }
                next()
            })

            if (extendExpressApp) extendExpressApp(app)

            // The next middleware must be the last one
            app.use(expressErrorHandler)
        },
    }
}

module.exports = {
    prepareKeystone,
}
