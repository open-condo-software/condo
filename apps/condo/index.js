const v8 = require('v8')

const { NextApp } = require('@keystonejs/app-next')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const isBetween = require('dayjs/plugin/isBetween')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

const conf = require('@open-condo/config')
const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')
const { AdapterCache } = require('@open-condo/keystone/adapterCache')
const { HealthCheck, getRedisHealthCheck, getPostgresHealthCheck } = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const metrics = require('@open-condo/keystone/metrics')
const { RequestCache } = require('@open-condo/keystone/requestCache')
const { TracingMiddleware } = require('@open-condo/keystone/tracing')
const { getWebhookModels } = require('@open-condo/webhooks/schema')

const { PaymentLinkMiddleware } = require('@condo/domains/acquiring/PaymentLinkMiddleware')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { VersioningMiddleware } = require('@condo/domains/common/utils/VersioningMiddleware')
const { UserExternalIdentityMiddleware } = require('@condo/domains/user/integration/UserExternalIdentityMiddleware')
const { OIDCMiddleware } = require('@condo/domains/user/oidc')

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production' && conf.DD_TRACE_ENABLED === 'true'
const IS_ENABLE_GRAFANA_TRACE = true

const IS_BUILD_PHASE = conf.PHASE === 'build'

// TODO(zuch): DOMA-2990: add FILE_FIELD_ADAPTER to env during build phase
if (IS_BUILD_PHASE) {
    process.env.FILE_FIELD_ADAPTER = 'local' // Test
}

if (IS_ENABLE_DD_TRACE && !IS_BUILD_PHASE) {
    require('dd-trace').init({
        logInjection: true,
    })
}

// Enable Open telemetry tracing
// if (IS_ENABLE_GRAFANA_TRACE && !IS_BUILD_PHASE) {
//     require('@open-condo/keystone/tracing').init()
// }

if (!IS_BUILD_PHASE) {
    setInterval(() => {
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
    }, 2000)
}

/** @deprecated */
const onConnect = async (keystone) => {
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
}

const schemas = () => [
    require('@condo/domains/common/schema'),
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
    require('@condo/domains/analytics/schema'),
    require('@condo/domains/scope/schema'),
    require('@condo/domains/news/schema'),
    require('@condo/domains/miniapp/schema'),
    require('@condo/domains/settings/schema'),
    getWebhookModels('@app/condo/schema.graphql'),
]

const tasks = () => [
    require('@condo/domains/common/tasks'),
    require('@condo/domains/acquiring/tasks'),
    require('@condo/domains/notification/tasks'),
    require('@condo/domains/organization/tasks'),
    require('@condo/domains/ticket/tasks'),
    require('@condo/domains/resident/tasks'),
    require('@condo/domains/scope/tasks'),
    require('@condo/domains/news/tasks'),
    require('@condo/domains/miniapp/tasks'),
    require('@open-condo/webhooks/tasks'),
]

const checks = [
    getRedisHealthCheck(),
    getPostgresHealthCheck(),
]

const lastApp = conf.NODE_ENV === 'test' ? undefined : new NextApp({ dir: '.' })
const apps = () => {
    return [
        new TracingMiddleware(),
        new HealthCheck({ checks }),
        new RequestCache(conf.REQUEST_CACHE_CONFIG ? JSON.parse(conf.REQUEST_CACHE_CONFIG) : {}),
        new AdapterCache(conf.ADAPTER_CACHE_CONFIG ? JSON.parse(conf.ADAPTER_CACHE_CONFIG) : {}),
        new VersioningMiddleware(),
        new OIDCMiddleware(),
        new FeaturesMiddleware(),
        new PaymentLinkMiddleware(),
        FileAdapter.makeFileAdapterMiddleware(),
        new UserExternalIdentityMiddleware(),
    ]
}

/** @type {(app: import('express').Application) => void} */
const extendExpressApp = (app) => {
    app.get('/.well-known/change-password', function (req, res) {
        res.redirect('/auth/forgot')
    })
}

module.exports = prepareKeystone({
    onConnect,
    extendExpressApp,
    schemas, tasks,
    apps, lastApp,
    ui: { hooks: require.resolve('@app/condo/admin-ui') },
})
