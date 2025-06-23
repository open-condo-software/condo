const process = require('node:process')
const v8 = require('v8')

const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const cuid = require('cuid')
const { json, urlencoded } = require('express')
const { get, identity } = require('lodash')
const nextCookie = require('next-cookies')
const { v4 } = require('uuid')


const conf = require('@open-condo/config')
const { safeApolloErrorFormatter } = require('@open-condo/keystone/apolloErrorFormatter')
const {
    ApolloRateLimitingPlugin,
    ApolloQueryBlockingPlugin,
    ApolloRequestLimitingPlugin,
} = require('@open-condo/keystone/apolloServerPlugins')
const { ExtendedPasswordAuthStrategy } = require('@open-condo/keystone/authStrategy/passwordAuth')
const { parseCorsSettings } = require('@open-condo/keystone/cors.utils')
const { _internalGetExecutionContextAsyncLocalStorage } = require('@open-condo/keystone/executionContext')
const { IpBlackListMiddleware } = require('@open-condo/keystone/ipBlackList')
const { registerSchemas } = require('@open-condo/keystone/KSv5v6/v5/registerSchema')
const { getKVClient, checkMinimalKVDataVersion } = require('@open-condo/keystone/kv')
const { getKeystonePinoOptions, GraphQLLoggerPlugin, getLogger } = require('@open-condo/keystone/logging')
const { expressErrorHandler } = require('@open-condo/keystone/logging/expressErrorHandler')
const metrics = require('@open-condo/keystone/metrics')
const { WhoAmIMiddleware } = require('@open-condo/keystone/middlewares')
const { composeNonResolveInputHook, composeResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { schemaDocPreprocessor, adminDocPreprocessor, escapeSearchPreprocessor, customAccessPostProcessor } = require('@open-condo/keystone/preprocessors')
const { RuntimeStatsMiddleware } = require('@open-condo/keystone/runtimeStats')
const { prepareDefaultKeystoneConfig } = require('@open-condo/keystone/setup.utils')
const { registerTasks, registerTaskQueues, taskQueues } = require('@open-condo/keystone/tasks')
const { KeystoneTracingApp } = require('@open-condo/keystone/tracing')

const { Keystone } = require('./keystone')
const { validateHeaders } = require('./validateHeaders')

const { GraphiqlApp } = require('../../graphiql')


const IS_BUILD_PHASE = conf.PHASE === 'build'
const IS_WORKER_PROCESS = conf.PHASE === 'worker'
const IS_BUILD = conf['DATABASE_URL'] === 'undefined'
const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development'
const IS_KEEP_ALIVE_ON_ERROR = get(conf, 'KEEP_ALIVE_ON_ERROR', false) === 'true'
// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'
// NOTE(pahaz): it's a magic number tested by @arichiv at https://developer.chrome.com/blog/cookie-max-age-expires/
const INFINITY_MAX_AGE_COOKIE = 1707195600
const SERVICE_USER_SESSION_TTL_IN_SEC = 7 * 24 * 60 * 60 // 7 days in sec

const REQUEST_LIMIT_CONFIG = JSON.parse(conf['REQUEST_LIMIT_CONFIG'] || '{}')
const IS_REQUEST_LIMIT_DISABLED = conf['DISABLE_REQUEST_LIMIT'] === 'true'

const RATE_LIMIT_CONFIG = JSON.parse(conf['RATE_LIMIT_CONFIG'] || '{}')
const IS_RATE_LIMIT_DISABLED = conf['DISABLE_RATE_LIMIT'] === 'true'

const BLOCKED_OPERATIONS = JSON.parse(conf['BLOCKED_OPERATIONS'] || '{}')

const logger = getLogger('uncaughtError')

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

    if (IS_WORKER_PROCESS && taskQueues.size > 0) {
        Array.from(taskQueues.entries()).forEach(([queueName, queue]) => {
            queue.getJobCounts().then(jobCounts => {
                metrics.gauge({ name: `worker.${queueName}.activeTasks`, value: jobCounts.active })
                metrics.gauge({ name: `worker.${queueName}.waitingTasks`, value: jobCounts.waiting })
                metrics.gauge({ name: `worker.${queueName}.completedTasks`, value: jobCounts.completed })
                metrics.gauge({ name: `worker.${queueName}.failedTasks`, value: jobCounts.failed })
                metrics.gauge({ name: `worker.${queueName}.delayedTasks`, value: jobCounts.delayed })
                metrics.gauge({ name: `worker.${queueName}.pausedTasks`, value: jobCounts.paused })
            })
        })
    }
}

class DataVersionChecker {
    async prepareMiddleware () {
        await checkMinimalKVDataVersion(2)
    }
}

function _getApolloServerPlugins (keystone) {
    /** @type {Array<import('apollo-server-plugin-base').ApolloServerPlugin>} */
    const apolloServerPlugins = [
        new ApolloQueryBlockingPlugin(BLOCKED_OPERATIONS),
    ]

    if (!IS_REQUEST_LIMIT_DISABLED) {
        apolloServerPlugins.push(new ApolloRequestLimitingPlugin(REQUEST_LIMIT_CONFIG))
    }

    if (!IS_RATE_LIMIT_DISABLED) {
        apolloServerPlugins.push(new ApolloRateLimitingPlugin(keystone, RATE_LIMIT_CONFIG))
    }

    // NOTE: Must be after all req.context filling plugins
    apolloServerPlugins.push(new GraphQLLoggerPlugin())

    return apolloServerPlugins
}

function prepareKeystone ({ onConnect, extendKeystoneConfig, extendExpressApp, schemas, schemasPreprocessors, tasks, queues, apps, lastApp, graphql, ui, authStrategyOpts }) {
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

    // patch access control handler to store skipAccessControl flag in context
    const accessControlContextHandler = keystone._getAccessControlContext
    keystone._getAccessControlContext = args => {
        const context = accessControlContextHandler(args)
        context.skipAccessControl = args.skipAccessControl
        return context
    }

    const globalPreprocessors = schemasPreprocessors ? schemasPreprocessors() : []
    globalPreprocessors.push(...[schemaDocPreprocessor, adminDocPreprocessor, escapeSearchPreprocessor, customAccessPostProcessor])
    // We need to register all schemas as they will appear in admin ui
    registerSchemas(keystone, schemas(), globalPreprocessors)

    const defaultAuthStrategyConfigHooks = {
        async afterAuth ({ item, token, success })   {
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
            const redisClient = getKVClient()
            // NOTE: if key not found returns 0, else 1.
            await redisClient.expire(sessKey, SERVICE_USER_SESSION_TTL_IN_SEC)
        },
    }

    const authStrategy = keystone.createAuthStrategy({
        type: ExtendedPasswordAuthStrategy,
        list: 'User',
        config: {
            protectIdentities: false,
            async findIdentityItems (config, list, args) {
                const { identityField } = config
                const identity = args[identityField]
                return await list.adapter.find({
                    [identityField]: identity,
                    deletedAt: null,
                })
            },
            ...get(authStrategyOpts, 'config', {}),
        },
        hooks: composeHooks(defaultAuthStrategyConfigHooks, get(authStrategyOpts, 'hooks', {})),
    })

    if (!IS_BUILD) {
        // Since tasks may require Redis connection, and Redis variable is not present during build time:
        // We need to register all tasks as they will be possible to execute
        registerTaskQueues(queues)
        if (tasks) registerTasks(tasks())
    }

    if (!IS_BUILD_PHASE) {
        setInterval(sendAppMetrics, 2000)
    }

    const apolloServerPlugins = _getApolloServerPlugins(keystone)

    return {
        keystone,
        // NOTE(pahaz): please, check the `executeDefaultServer(..)` to understand how it works.
        // And you need to look at `keystone/lib/Keystone/index.js:602` it uses `{ origin: true, credentials: true }` as default value for cors!
        // Examples: https://expressjs.com/en/resources/middleware/cors.html or check `node_modules/cors/README.md`
        cors: (conf.CORS) ? parseCorsSettings(JSON.parse(conf.CORS)) : { origin: true, credentials: true },
        pinoOptions: getKeystonePinoOptions(),
        apps: [
            new RuntimeStatsMiddleware(),
            new DataVersionChecker(),
            new IpBlackListMiddleware(),
            new KeystoneTracingApp(),
            new WhoAmIMiddleware(),
            ...((apps) ? apps() : []),
            ...(IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND ? [
                new GraphiqlApp({
                    allowedQueryParams: ['deleted'],
                }),
            ] : []),
            new GraphQLApp({
                apollo: {
                    formatError: safeApolloErrorFormatter,
                    debug: IS_ENABLE_APOLLO_DEBUG,
                    introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                    playground: false,
                    plugins: apolloServerPlugins,
                },
                apiPath: /^\/admin\/api\/?$/,
                ...(graphql || {}),
            }),
            new AdminUIApp({
                adminPath: '/admin',
                isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport || user.rightsSet)),
                authStrategy,
                showDashboardCounts: false,
                ...(ui || {}),
            }),
            lastApp,
        ].filter(identity),

        /** @type {(app: import('express').Application) => void} */
        configureExpress: (app) => {
            const requestIdHeaderName = 'x-request-id'
            const startRequestIdHeaderName = 'x-start-request-id'

            // NOTE(pahaz): we are always behind reverse proxy
            app.set('trust proxy', true)

            app.use(function validateHeadersToPreventInjectionAttacks (req, res, next) {
                try {
                    validateHeaders(req.headers)
                } catch (err) {
                    logger.error({ msg: 'InvalidHeader', err })
                    res.status(423).send({ error: err.message })
                }
                next()
            })

            // NOTE(toplenboren): we need a custom body parser for custom file upload limit
            app.use(json({ limit: '100mb', extended: true }))
            app.use(urlencoded({ limit: '100mb', extended: true }))


            app.use(function reqId (req, res, next) {
                const reqId = req.get(requestIdHeaderName) || v4()
                const startReqId = req.get(startRequestIdHeaderName) || reqId

                _internalGetExecutionContextAsyncLocalStorage().run({ reqId, startReqId }, () => {
                    // we are expecting to receive reqId from client in order to have fully traced logs end to end
                    // also, property name are constant name, not a dynamic user input
                    // nosemgrep: javascript.express.security.audit.remote-property-injection.remote-property-injection
                    req['id'] = req.headers[requestIdHeaderName] = reqId
                    // nosemgrep: javascript.express.security.audit.remote-property-injection.remote-property-injection
                    req['startId'] = req.headers[startRequestIdHeaderName] = startReqId

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

process.on('uncaughtException', (err, origin) => {
    logger.error({ msg: 'uncaughtException', err, origin })
    if (IS_WORKER_PROCESS || !IS_KEEP_ALIVE_ON_ERROR) {
        throw err
    }
})

process.on('unhandledRejection', (err, promise) => {
    logger.error({ msg: 'unhandledRejection', err, promise })
    if (IS_WORKER_PROCESS || !IS_KEEP_ALIVE_ON_ERROR) {
        throw err
    }
})

function composeHooks (defaultHooksOptions = {}, hooksOptions = {}) {
    const hooks = {}
    const hookNames = [
        'afterAuth',
        'beforeUnauth',
        'resolveInput',
        'validateInput',
        'beforeChanges',
        'afterChanges',
    ]
    for (const hookName of hookNames) {
        let composer = composeNonResolveInputHook
        if (hookName === 'resolveInput') {
            composer = composeResolveInputHook
        }

        if (defaultHooksOptions[hookName] && hooksOptions[hookName]) {
            hooks[hookName] = composer(defaultHooksOptions[hookName], hooksOptions[hookName])
        } else {
            hooks[hookName] = defaultHooksOptions[hookName] || hooksOptions[hookName]
        }
    }
    return hooks
}

module.exports = {
    prepareKeystone,
}
