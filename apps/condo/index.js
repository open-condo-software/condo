const packageJson = require('@app/condo/package.json')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { NextApp } = require('@keystonejs/app-next')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { Keystone } = require('@keystonejs/keystone')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const bodyParser = require('body-parser')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const express = require('express')
const { identity } = require('lodash')
const get = require('lodash/get')
const nextCookie = require('next-cookies')
const { v4 } = require('uuid')


const conf = require('@open-condo/config')
const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { formatError } = require('@open-condo/keystone/apolloErrorFormatter')
const { KeystoneCacheMiddleware } = require('@open-condo/keystone/cache')
const { registerSchemas } = require('@open-condo/keystone/KSv5v6/v5/registerSchema')
const { GraphQLLoggerPlugin } = require('@open-condo/keystone/logging')
const { escapeSearchPreprocessor } = require('@open-condo/keystone/preprocessors/escapeSearch')
const { schemaDocPreprocessor } = require('@open-condo/keystone/preprocessors/schemaDoc')
const { prepareDefaultKeystoneConfig, getAdapter } = require('@open-condo/keystone/setup.utils')
const { getWebhookModels } = require('@open-condo/webhooks/schema')

const { PaymentLinkMiddleware } = require('@condo/domains/acquiring/PaymentLinkMiddleware')
const { parseCorsSettings } = require('@condo/domains/common/utils/cors.utils')
const { expressErrorHandler } = require('@condo/domains/common/utils/expressErrorHandler')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { makeId } = require('@condo/domains/common/utils/makeid.utils')
const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')
const { UserExternalIdentityMiddleware } = require('@condo/domains/user/integration/UserExternalIdentityMiddleware')
const { OIDCMiddleware } = require('@condo/domains/user/oidc')


dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

const FINGERPRINT_FORMAT_REGEXP = /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/

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

// eslint-disable-next-line import/order
const { getType } = require('@keystonejs/utils')
// eslint-disable-next-line import/order
const { evaluateKeystoneAccessResult, evaluateKeystoneFieldAccessResult } = require('@open-condo/keystone/plugins/utils')
// eslint-disable-next-line import/order
const { GQL_LIST_SCHEMA_TYPE } = require('@open-condo/keystone/schema')

// eslint-disable-next-line import/order
const process_1 = require('process')
delete process_1.env['DEBUG']


function fieldAccessWrapperIfNeeded (access, fnWrapper, asyncFnWrapper) {
    // NOTE: you can use the same object in many places! you don't needed to wrap it twice
    if (!fnWrapper.alreadyprocessedbyexamplefieldprocessor) fnWrapper.alreadyprocessedbyexamplefieldprocessor = true
    if (!asyncFnWrapper.alreadyprocessedbyexamplefieldprocessor) asyncFnWrapper.alreadyprocessedbyexamplefieldprocessor = true
    const type = getType(access)
    if (type === 'Boolean') {
        // No need to wrap! You already have access or you should not have it anyway!
        return access
    } else if (type === 'Function') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbyexamplefieldprocessor) return access
        else return fnWrapper
    } else if (type === 'AsyncFunction') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbyexamplefieldprocessor) return access
        else return asyncFnWrapper
    } else if (type === 'Object') {
        const newAccess = {}
        if (typeof access.read !== 'undefined') newAccess.read = fieldAccessWrapperIfNeeded(access.read, fnWrapper, asyncFnWrapper)
        if (typeof access.create !== 'undefined') newAccess.create = fieldAccessWrapperIfNeeded(access.create, fnWrapper, asyncFnWrapper)
        if (typeof access.update !== 'undefined') newAccess.update = fieldAccessWrapperIfNeeded(access.update, fnWrapper, asyncFnWrapper)
        if (typeof access.delete !== 'undefined') newAccess.delete = fieldAccessWrapperIfNeeded(access.delete, fnWrapper, asyncFnWrapper)
        if (typeof access.auth !== 'undefined') newAccess.auth = fieldAccessWrapperIfNeeded(access.auth, fnWrapper, asyncFnWrapper)
        return newAccess
    }

    throw new Error(
        `fieldAccessWrapperIfNeeded(), received ${type}.`,
    )
}

function fieldExampleProcessor (schemaType, name, schema) {
    if (schemaType === GQL_LIST_SCHEMA_TYPE && !name.endsWith('HistoryRecord')) {

        const access = schema.access
        const newSchemaAccess = (args) => {
            const { operation } = args
            return evaluateKeystoneAccessResult(access, operation, args)
        }

        const newAccess = fieldAccessWrapperIfNeeded(access, newSchemaAccess, newSchemaAccess)
        schema.access = newAccess

        console.log('fieldExampleProcessor', name, access, newAccess)

        Object.keys(schema.fields).forEach(field => {
            const access = schema.fields[field].access
            if (access) {
                const newFieldAccess = (args) => {
                    const { operation } = args
                    return evaluateKeystoneFieldAccessResult(access, operation, args)
                }

                const newAccess = fieldAccessWrapperIfNeeded(access, newFieldAccess, newFieldAccess)
                // if (access !== newAccess) console.log(name, field, access, newAccess)
                schema.fields[field].access = newAccess
            }
        })
    }

    return schema
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
    require('@condo/domains/banking/schema'),
    require('@condo/domains/ticket/schema'),
    require('@condo/domains/notification/schema'),
    require('@condo/domains/contact/schema'),
    require('@condo/domains/resident/schema'),
    require('@condo/domains/onboarding/schema'),
    require('@condo/domains/meter/schema'),
    require('@condo/domains/subscription/schema'),
    require('@condo/domains/acquiring/schema'),
    require('@condo/domains/miniapp/schema'),
    require('@condo/domains/analytics/schema'),
    require('@condo/domains/scope/schema'),
    require('@condo/domains/news/schema'),
    getWebhookModels('@app/condo/schema.graphql'),
], [schemaDocPreprocessor, escapeSearchPreprocessor, fieldExampleProcessor])

if (!IS_BUILD_PHASE) {
    // NOTE(pahaz): we put it here because it inits the redis connection and we don't want it at build time
    const { registerTasks } = require('@open-condo/keystone/tasks')

    registerTasks([
        require('@condo/domains/notification/tasks'),
        require('@condo/domains/organization/tasks'),
        require('@condo/domains/ticket/tasks'),
        require('@condo/domains/resident/tasks'),
        require('@condo/domains/scope/tasks'),
        require('@open-condo/webhooks/tasks'),
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




module.exports = {
    // NOTE(pahaz): please, check the `executeDefaultServer(..)` to understand how it works.
    // And you need to look at `keystone/lib/Keystone/index.js:602` it uses `{ origin: true, credentials: true }` as default value for cors!
    // Examples: https://expressjs.com/en/resources/middleware/cors.html or check `node_modules/cors/README.md`
    ...conf.CORS ? { cors: parseCorsSettings(JSON.parse(conf.CORS)) } : {},
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
        new UserExternalIdentityMiddleware(),
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
                        format: FINGERPRINT_FORMAT_REGEXP,
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
