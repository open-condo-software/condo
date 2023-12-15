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
const { RequestCache } = require('@open-condo/keystone/requestCache')
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
    require('@condo/domains/marketplace/schema'),
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
    require('@condo/domains/marketplace/tasks'),
]

const checks = [
    getRedisHealthCheck(),
    getPostgresHealthCheck(),
]

const lastApp = conf.NODE_ENV === 'test' ? undefined : new NextApp({ dir: '.' })
const apps = () => {
    return [
        new HealthCheck({ checks }),
        new RequestCache(conf.REQUEST_CACHE_CONFIG ? JSON.parse(conf.REQUEST_CACHE_CONFIG) : { enabled: false }),
        new AdapterCache(conf.ADAPTER_CACHE_CONFIG ? JSON.parse(conf.ADAPTER_CACHE_CONFIG) : { enabled: false }),
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
