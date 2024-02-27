const v8 = require('v8')

const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { Keystone } = require('@keystonejs/keystone')
const cuid = require('cuid')
const { json, urlencoded } = require('express')
const identity = require('lodash/identity')
const nextCookie = require('next-cookies')
const { v4 } = require('uuid')

const conf = require('@open-condo/config')
const { formatError } = require('@open-condo/keystone/apolloErrorFormatter')
const { IpBlackListMiddleware } = require('@open-condo/keystone/ipBlackList')
const { registerSchemas } = require('@open-condo/keystone/KSv5v6/v5/registerSchema')
const { getKeystonePinoOptions, GraphQLLoggerPlugin } = require('@open-condo/keystone/logging')
const metrics = require('@open-condo/keystone/metrics')
const { schemaDocPreprocessor, adminDocPreprocessor, escapeSearchPreprocessor, customAccessPostProcessor } = require('@open-condo/keystone/preprocessors')
const { ApolloRateLimitingPlugin } = require('@open-condo/keystone/rateLimiting')
const { ApolloSentryPlugin } = require('@open-condo/keystone/sentry')
const { registerTasks, taskQueue } = require('@open-condo/keystone/tasks')
const { KeystoneTracingApp } = require('@open-condo/keystone/tracing')

const { parseCorsSettings } = require('../../cors.utils')
const { _internalGetExecutionContextAsyncLocalStorage } = require('../../executionContext')
const { expressErrorHandler } = require('../../logging/expressErrorHandler')
const { getRedisClient } = require('../../redis')
const { prepareDefaultKeystoneConfig } = require('../../setup.utils')

const IS_BUILD_PHASE = conf.PHASE === 'build'
const IS_BUILD = conf['DATABASE_URL'] === 'undefined'
const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'
// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'
// NOTE(pahaz): it's a magic number tested by @arichiv at https://developer.chrome.com/blog/cookie-max-age-expires/
const INFINITY_MAX_AGE_COOKIE = 1707195600
const SERVICE_USER_SESSION_TTL_IN_SEC = 7 * 24 * 60 * 60 // 7 days in sec

const sendAppMetrics = () => {
    const v8Stats = v8.getHeapStatistics()
    metrics.gauge({ name: 'v8.totalHeapSize', value: v8Stats.total_heap_size })
    metrics.gauge({ name: 'v8.usedHeapSize', value: v8Stats.used_heap_size })
    metrics.gauge({ name: 'v8.totalAvailableSize', value: v8Stats.total_available_size })
    metrics.gauge({ name: 'v8.totalHeapSizeExecutable', value: v8Stats.total_heap_size_executable })
    metrics.gauge({ name: 'v8.totalPhysicalSize', value: v8Stats.total_physical_size })
    metrics.gauge({ name: 'v8.heapSizeLimit', value: v8Stats.heap_size_limit })
    metrics.gauge({ name: 'v8.mallocatedMemory', value: v8Stats.malloced_memory })
    metrics.gauge({ name: 'v8.peakMallocatedMemory', value: v8Stats.peak_malloced_memory })
    metrics.gauge({ name: 'v8.doesZapGarbage', value: v8Stats.does_zap_garbage })
    metrics.gauge({ name: 'v8.numberOfNativeContexts', value: v8Stats.number_of_native_contexts })
    metrics.gauge({ name: 'v8.numberOfDetachedContexts', value: v8Stats.number_of_detached_contexts })

    const memUsage = process.memoryUsage()
    metrics.gauge({ name: 'processMemoryUsage.heapTotal', value: memUsage.heapTotal })
    metrics.gauge({ name: 'processMemoryUsage.heapUsed', value: memUsage.heapUsed })
    metrics.gauge({ name: 'processMemoryUsage.rss', value: memUsage.rss })
    metrics.gauge({ name: 'processMemoryUsage.external', value: memUsage.external })

    if (taskQueue) {
        taskQueue.getJobCounts().then(jobCounts => {
            metrics.gauge({ name: 'worker.activeTasks', value: jobCounts.active })
            metrics.gauge({ name: 'worker.waitingTasks', value: jobCounts.waiting })
            metrics.gauge({ name: 'worker.completedTasks', value: jobCounts.completed })
            metrics.gauge({ name: 'worker.failedTasks', value: jobCounts.failed })
            metrics.gauge({ name: 'worker.delayedTasks', value: jobCounts.delayed })
            metrics.gauge({ name: 'worker.pausedTasks', value: jobCounts.paused })
        })
    }
}

function prepareKeystone ({ onConnect, extendKeystoneConfig, extendExpressApp, schemas, schemasPreprocessors, tasks, apps, lastApp, graphql, ui }) {
    // trying to be compatible with keystone-6 and keystone-5
    // TODO(pahaz): add storage like https://keystonejs.com/docs/config/config#storage-images-and-files

    if (!schemas) throw new Error('schemas argument is required')
    if (schemas && typeof schemas !== 'function') throw new Error('schemas should be a function like `() => [ Schema ]`')
    if (schemasPreprocessors && typeof schemasPreprocessors !== 'function') throw new Error('schemasPreprocessors should be a function like `() => [ preprocessor ]`')
    if (tasks && typeof tasks !== 'function') throw new Error('tasks should be a function like `() => [ Task ]`')
    if (apps && typeof apps !== 'function') throw new Error('apps should be a function like `() => [ App | Middleware ]`')

    const keystoneConfig = prepareDefaultKeystoneConfig(conf)
    let extendedKeystoneConfig = {}
    if (extendKeystoneConfig && typeof extendedKeystoneConfig === 'function') {
        extendedKeystoneConfig = extendKeystoneConfig(keystoneConfig)
    }

    const keystone = new Keystone({
        ...keystoneConfig,
        onConnect: async () => onConnect && onConnect(keystone),
        ...extendedKeystoneConfig,
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
        hooks: {
            async afterAuth ({ item, token, success })  {
                // NOTE: It's triggered only by default Keystone mutation, "authenticateUserWithPhoneAndPassword" will not work here
                // Step 1. Skip if auth was not succeeded
                if (!success || !token) {
                    return
                }
                // Step 2. Skip this for any non-service user, or users without type field
                if (!item || !item.type || item.type !== 'service') {
                    return
                }
                // NOTE: auth token is just session token prefix (32 chars) + some prefix after dot.
                // Example: 12345678901234567890123456789012.asdhaksdjhajskdhajskdhjkas
                // Session token can be build like so "sess:{prefixBeforeDot}"
                const sessToken = token.split('.')[0]
                const sessKey = `sess:${sessToken}`
                const redisClient = getRedisClient()
                // NOTE: if key not found returns 0, else 1.
                await redisClient.expire(sessKey, SERVICE_USER_SESSION_TTL_IN_SEC)
            },
        },
    })

    if (!IS_BUILD) {
        // Since tasks may require Redis connection, and Redis variable is not present during build time:
        // We need to register all tasks as they will be possible to execute
        if (tasks) registerTasks(tasks())
    }

    if (!IS_BUILD_PHASE) {
        setInterval(sendAppMetrics, 2000)
    }

    return {
        keystone,
        // NOTE(pahaz): please, check the `executeDefaultServer(..)` to understand how it works.
        // And you need to look at `keystone/lib/Keystone/index.js:602` it uses `{ origin: true, credentials: true }` as default value for cors!
        // Examples: https://expressjs.com/en/resources/middleware/cors.html or check `node_modules/cors/README.md`
        cors: (conf.CORS) ? parseCorsSettings(JSON.parse(conf.CORS)) : { origin: true, credentials: true },
        pinoOptions: getKeystonePinoOptions(),
        apps: [
            new IpBlackListMiddleware(),
            new KeystoneTracingApp(),
            ...((apps) ? apps() : []),
            new GraphQLApp({
                apollo: {
                    formatError,
                    debug: IS_ENABLE_APOLLO_DEBUG,
                    introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                    playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                    plugins: [
                        new ApolloSentryPlugin(),
                        new ApolloRateLimitingPlugin(keystone),
                        new GraphQLLoggerPlugin(),
                    ],
                },
                ...(graphql || {}),
            }),
            new AdminUIApp({
                adminPath: '/admin',
                isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport || user.rightsSet)),
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
            app.use(json({ limit: '100mb', extended: true }))
            app.use(urlencoded({ limit: '100mb', extended: true }))

            const requestIdHeaderName = 'X-Request-Id'
            app.use(function reqId (req, res, next) {
                const reqId = req.headers[requestIdHeaderName.toLowerCase()] || v4()
                _internalGetExecutionContextAsyncLocalStorage().run({ reqId }, () => {
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
