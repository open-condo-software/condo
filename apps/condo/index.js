const { identity } = require('lodash')
const { v4 } = require('uuid')
const express = require('express')
const bodyParser = require('body-parser')
const nextCookie = require('next-cookies')
const get = require('lodash/get')

const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { NextApp } = require('@keystonejs/app-next')
const { createItems } = require('@keystonejs/server-side-graphql-client')

const conf = require('@condo/config')
const { prepareDefaultKeystoneConfig, getAdapter } = require('@condo/keystone/setup.utils')
const { registerSchemas } = require('@condo/keystone/KSv5v6/v5/registerSchema')
const { schemaDocPreprocessor } = require('@condo/keystone/preprocessors/schemaDoc')
const { escapeSearchPreprocessor } = require('@condo/keystone/preprocessors/escapeSearch')

const { makeId } = require('@condo/domains/common/utils/makeid.utils')
const { formatError } = require('@condo/keystone/apolloErrorFormatter')
const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')
const { SbbolMiddleware } = require('@condo/domains/organization/integrations/sbbol/routes')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { KeystoneCacheMiddleware } = require('@condo/keystone/cache')
const { expressErrorHandler } = require('@condo/domains/common/utils/expressErrorHandler')
const { GraphQLLoggerPlugin } = require('@condo/keystone/logging')
const { OIDCMiddleware } = require('@condo/domains/user/oidc')

const packageJson = require('@app/condo/package.json')
const { featureToggleManager } = require('@condo/featureflags/featureToggleManager')
const { FeaturesMiddleware } = require('@condo/featureflags/FeaturesMiddleware')
const { PaymentLinkRouter } = require('@condo/domains/routes/paymentLinkRouter')
const { PAYMENT_LINK_PATH } = require('@condo/domains/acquiring/constants/links')


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
    require('@condo/domains/analytics/schema'),
], [schemaDocPreprocessor, escapeSearchPreprocessor])

if (!IS_BUILD_PHASE) {
    // NOTE(pahaz): we put it here because it inits the redis connection and we don't want it at build time
    const { registerTriggers } = require('@condo/triggers')
    const { registerTasks } = require('@condo/keystone/tasks')

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

class VersioningMiddleware {
    async prepareMiddleware () {
        const app = express()
        app.use('/api/version', (req, res) => {
            res.status(200).json({
                build: get(process.env, 'WERF_COMMIT_HASH', packageJson.version),
            })
        })

        return app
    }
}

class PaymentLinkMiddleware {
    async prepareMiddleware () {
        const features = await featureToggleManager.fetchFeatures()

        if (get(features, 'payment_link.defaultValue')) {
            const app = express()

            const router = new PaymentLinkRouter()
            await router.init()
            app.get(PAYMENT_LINK_PATH, router.handleRequest.bind(router))

            return app
        }
    }
}

module.exports = {
    keystone,
    apps: [
        keystoneCacheApp,
        new VersioningMiddleware(),
        new OIDCMiddleware(),
        new FeaturesMiddleware(),
        new PaymentLinkMiddleware(),
        new GraphQLApp({
            apollo: {
                formatError,
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                plugins: [new GraphQLLoggerPlugin()],
            },
        }),
        FileAdapter.makeFileAdapterMiddleware(),
        new SbbolMiddleware(),
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
                res.cookie('sender', JSON.stringify({ fingerprint: cookies['userId'] || makeId(12), dv: 1 }))
                res.cookie('dv', 1)
            }
            next()
        })

        app.use('/admin/api', async (req, res, next) => {
            req.features = await featureToggleManager.fetchFeatures()

            // try-catch must be strictly before error handler
            try {
                return next()
            } catch (err) {
                return next(err)
            }
        })

        // The next middleware must be the last one
        app.use(expressErrorHandler)
    },
}
