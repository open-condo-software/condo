const { identity } = require('lodash')
const { v4 } = require('uuid')
const express = require('express')
const bodyParser = require('body-parser')
const nextCookie = require('next-cookies')

const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { NextApp } = require('@keystonejs/app-next')
const { createItems } = require('@keystonejs/server-side-graphql-client')

const conf = require('@core/config')
const { prepareDefaultKeystoneConfig, getAdapter } = require('@core/keystone/setup.utils')
const { registerSchemas } = require('@core/keystone/KSv5v6/v5/registerSchema')
const { schemaDocPreprocessor } = require('@core/keystone/preprocessors/schemaDoc')

const { makeId } = require('@condo/domains/common/utils/makeid.utils')
const { formatError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')
const { SbbolRoutes } = require('@condo/domains/organization/integrations/sbbol/routes')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { KeystoneCacheMiddleware } = require('@core/keystone/cache')
const { expressErrorHandler } = require('@condo/domains/common/utils/expressErrorHandler')
const { GraphQLLoggerApp } = require('@condo/domains/common/utils/GraphQLLoggerApp')
const { OIDCMiddleware } = require('@condo/domains/user/oidc')
const { createProxyMiddleware } = require('http-proxy-middleware')


const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production' && conf.DD_TRACE_ENABLED === 'true'
const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'

const IS_ENABLE_CACHE = conf.ENABLE_CACHE === '1'
const IS_BUILD_PHASE = conf.PHASE === 'build'
const IS_ON_WORKER = conf.PHASE === 'worker'

// TODO(zuch): DOMA-2990: add FILE_FIELD_ADAPTER to env during build phase
if (IS_BUILD_PHASE) {
    process.env.FILE_FIELD_ADAPTER = 'local' // Test
}

// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'

if (IS_ENABLE_DD_TRACE && !IS_BUILD_PHASE) {
    require('dd-trace').init({
        logInjection: true,
    })
}

const keystoneConfig = (IS_BUILD_PHASE) ? {
    cookieSecret: v4(),
    adapter: getAdapter('undefined'),
} : prepareDefaultKeystoneConfig(conf)
const keystone = new Keystone({
    ...keystoneConfig,
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development' && conf.NODE_ENV !== 'test') return // Just for dev env purposes!
        // This function can be called before tables are created! (we just ignore this)
        const users = await keystone.lists.User.adapter.findAll()
        if (!users.length) {
            const initialData = require('./initialData')
            for (let { listKey, items } of initialData) {
                console.log(`🗿 createItems(${listKey}) -> ${items.length}`)
                await createItems({
                    keystone,
                    listKey,
                    items,
                })
            }
        }
    },
})

let keystoneCacheApp = undefined
if (IS_ENABLE_CACHE) {
    keystoneCacheApp = new KeystoneCacheMiddleware(keystone)
}

// Because Babel is used only for frontend to transpile and optimise code,
// backend files will bring unnecessary workload to building stage.
// They can be safely ignored without impact on final executable code

// We need to register all schemas as they will appear in admin ui
registerSchemas(keystone, [
    require('@condo/domains/user/schema'),
    require('@condo/domains/organization/schema'),
    require('@condo/domains/property/schema'),
    require('@condo/domains/billing/schema'),
    require('@condo/domains/ticket/schema'),
    require('@condo/domains/notification/schema'),
    require('@condo/domains/contact/schema'),
    require('@condo/domains/resident/schema'),
    require('@condo/domains/onboarding/schema'),
    require('@condo/domains/division/schema'),
    require('@condo/domains/meter/schema'),
    require('@condo/domains/subscription/schema'),
    require('@condo/domains/acquiring/schema'),
    require('@condo/domains/miniapp/schema'),
], [schemaDocPreprocessor])

if (!IS_BUILD_PHASE) {
    // NOTE(pahaz): we put it here because it inits the redis connection and we don't want it at build time
    const { registerTriggers } = require('@core/triggers')
    const { registerTasks } = require('@core/keystone/tasks')

    registerTasks([
        require('@condo/domains/notification/tasks'),
        require('@condo/domains/organization/tasks'),
        require('@condo/domains/ticket/tasks'),
        require('@condo/domains/resident/tasks'),
    ])

    registerTriggers([
        require('@condo/domains/ticket/triggers'),
    ])
}

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
    config: {
        protectIdentities: false,
    },
})

class SberBuisnessOnlineMiddleware {
    async prepareMiddleware () {
        const Auth = new SbbolRoutes()
        const app = express()
        // TODO(zuch): find a way to remove bind
        app.get('/api/sbbol/auth', Auth.startAuth.bind(Auth))
        app.get('/api/sbbol/auth/callback', Auth.completeAuth.bind(Auth))
        app.use(expressErrorHandler)
        return app
    }
}


module.exports = {
    keystone,
    apps: [
        keystoneCacheApp,
        new GraphQLLoggerApp(),
        new OIDCMiddleware(),
        new GraphQLApp({
            apollo: {
                formatError,
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
            },
        }),
        FileAdapter.makeFileAdapterMiddleware(),
        new SberBuisnessOnlineMiddleware(),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport)),
            authStrategy,
            hooks: require.resolve('@app/condo/admin-ui'),
        }),
        conf.NODE_ENV === 'test' || IS_ON_WORKER ? undefined : new NextApp({ dir: '.' }),
    ].filter(identity),

    /** @type {(app: import('express').Application) => void} */
    configureExpress: (app) => {
        // app.use('/admin/api', createProxyMiddleware(function (pathname, req) {
        //     console.log(`HEADERS=${JSON.stringify(req.headers)}`)
        //     if (req.headers['client-platform'] === 'Android') {
        //         console.log(`MOBILE APP: ${req.headers['client-platform']}=${req.headers['client-version']}`)
        //     }
        //     return req.headers['client-platform'] === 'Android' && req.headers['client-version'] === '1.0.31'
        // }, { target: 'https://v1.doma.ai/admin/api', changeOrigin: true }))

        app.set('trust proxy', true)
        // NOTE(toplenboren): we need a custom body parser for custom file upload limit
        app.use(bodyParser.json({ limit: '100mb', extended: true }))
        app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))

        const requestIdHeaderName = 'X-Request-Id'
        app.use(function reqId (req, res, next) {
            const reqId = req.headers[requestIdHeaderName.toLowerCase()] || v4()
            req['id'] = req.headers[requestIdHeaderName.toLowerCase()] = reqId
            res.setHeader(requestIdHeaderName, reqId)
            next()
        })

        app.get('/.well-known/change-password', function (req, res) {
            res.redirect('/auth/forgot')
        })

        app.use('/admin/', (req, res, next) => {
            if (req.url === '/api') return next()
            const cookies = nextCookie({ req })
            const isSenderValid = hasValidJsonStructure(
                {
                    resolvedData: { sender: cookies['sender'] },
                    fieldPath: 'sender',
                    addFieldValidationError: () => null,
                },
                true,
                1,
                {
                    fingerprint: {
                        presence: true,
                        format: /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/,
                        length: { minimum: 5, maximum: 42 },
                    },
                })
            if (!isSenderValid) {
                res.cookie('sender', JSON.stringify({ fingerprint: makeId(12), dv: 1 }))
                res.cookie('dv', 1)
            }
            next()
        })
    },
}
