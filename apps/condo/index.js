// eslint-disable-next-line
const tracer = require('dd-trace')  // Note: required for monkey patching

const { NextApp } = require('@keystonejs/app-next')
const Sentry = require('@sentry/node')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const isBetween = require('dayjs/plugin/isBetween')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

const conf = require('@open-condo/config')
const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')
const { AdapterCache } = require('@open-condo/keystone/adapterCache')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const {
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
    getCertificateHealthCheck,
    getPfxCertificateHealthCheck,
} = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { RequestCache } = require('@open-condo/keystone/requestCache')
const { getXRemoteApp, getXRemoteClient, getXRemoteVersion, getAppName } = require('@open-condo/keystone/tracingUtils')
const { getWebhookModels } = require('@open-condo/webhooks/schema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const { PaymentLinkMiddleware } = require('@condo/domains/acquiring/PaymentLinkMiddleware')
const { VersioningMiddleware, getCurrentVersion } = require('@condo/domains/common/utils/VersioningMiddleware')
const { UnsubscribeMiddleware } = require('@condo/domains/notification/UnsubscribeMiddleware')
const { UserExternalIdentityMiddleware } = require('@condo/domains/user/integration/UserExternalIdentityMiddleware')
const { OIDCMiddleware } = require('@condo/domains/user/oidc')

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production' && conf.DD_TRACE_ENABLED === 'true'
const IS_BUILD_PHASE = conf.PHASE === 'build'
const SENTRY_CONFIG = conf.SENTRY_CONFIG ? JSON.parse(conf.SENTRY_CONFIG) : {}

// TODO(zuch): DOMA-2990: add FILE_FIELD_ADAPTER to env during build phase
if (IS_BUILD_PHASE) {
    process.env.FILE_FIELD_ADAPTER = 'local' // Test
}

if (IS_ENABLE_DD_TRACE && !IS_BUILD_PHASE) {
    const appName = getAppName()
    const xRemoteApp = getXRemoteApp()
    const xRemoteClient = getXRemoteClient()
    const xRemoteVersion = getXRemoteVersion()
    // NOTE: https://datadoghq.dev/dd-trace-js/
    tracer.init({
        // Note: we need to save old service name as `root` to save history
        service: (appName === 'condo-app') ? 'root' : appName,
        tags: { xRemoteApp, xRemoteClient, xRemoteVersion },
    })
    tracer.use('express', {
        // hook will be executed right before the request span is finished
        headers: [
            'X-Remote-Client', 'X-Remote-App', 'X-Remote-Version',
            'X-Request-ID', 'X-Start-Request-ID',
            'X-Parent-Request-ID', 'X-Parent-Task-ID', 'X-Parent-Exec-ID',
        ],
        hooks: {
            request: (span, req, res) => {
                if (req?.id) span.setTag('reqId', req.id)
                if (req?.startId) span.setTag('startId', req.startId)
                if (req?.user?.id) span.setTag('userId', req.user.id)
            },
        },
    })
    tracer.use('graphql')
    tracer.use('apollo')
    tracer.use('next')
    tracer.use('fetch')
    tracer.use('ioredis', { splitByInstance: true })
    tracer.use('pg')
    tracer.use('knex')
    tracer.use('net')
    tracer.use('dns')
    tracer.use('child_process')
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
    require('@condo/domains/document/schema'),
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
    getWebhookTasks('low'),
    require('@condo/domains/marketplace/tasks'),
    require('@condo/domains/analytics/tasks'),
]

if (!IS_BUILD_PHASE && SENTRY_CONFIG['server']) {
    Sentry.init({
        dsn: SENTRY_CONFIG['server']['dsn'],
        debug: false,
        tracesSampleRate: SENTRY_CONFIG['server']['sampleRate'],
        sampleRate: SENTRY_CONFIG['server']['sampleRate'],
        environment: SENTRY_CONFIG['server']['environment'],
        organization: SENTRY_CONFIG['server']['organization'],
        project: SENTRY_CONFIG['server']['project'],
        release: `${SENTRY_CONFIG['server']['environment']}-${getCurrentVersion()}`,
    })
}

const checks = [
    getRedisHealthCheck(),
    getPostgresHealthCheck(),
    getCertificateHealthCheck({
        certificateName: 'sber_id_client',
        getCertificate: () => {
            const SBER_ID_CONFIG = conf['SBER_ID_CONFIG'] && JSON.parse(conf['SBER_ID_CONFIG']) || {}
            return SBER_ID_CONFIG.cert
        },
    }),
    getPfxCertificateHealthCheck({
        certificateName: 'sbbol_client',
        getPfxParams: () => {
            const SBBOL_PFX = conf['SBBOL_PFX'] && JSON.parse(conf['SBBOL_PFX']) || {}
            return { pfx: SBBOL_PFX.certificate, passphrase: SBBOL_PFX.passphrase }
        },
    }),
    getPfxCertificateHealthCheck({
        certificateName: 'sbbol_client_extended',
        getPfxParams: () => {
            const SBBOL_PFX_EXTENDED = conf['SBBOL_PFX_EXTENDED'] && JSON.parse(conf['SBBOL_PFX_EXTENDED']) || {}
            return { pfx: SBBOL_PFX_EXTENDED.certificate, passphrase: SBBOL_PFX_EXTENDED.passphrase }
        },
    }),
]

const lastApp = conf.DISABLE_NEXT_APP ? undefined : new NextApp({ dir: '.' })

const apps = () => {
    return [
        new HealthCheck({ checks }),
        new RequestCache(conf.REQUEST_CACHE_CONFIG ? JSON.parse(conf.REQUEST_CACHE_CONFIG) : { enabled: false }),
        new AdapterCache(conf.ADAPTER_CACHE_CONFIG ? JSON.parse(conf.ADAPTER_CACHE_CONFIG) : { enabled: false }),
        new VersioningMiddleware(),
        new OIDCMiddleware(),
        new FeaturesMiddleware(),
        new PaymentLinkMiddleware(),
        new UnsubscribeMiddleware(),
        FileAdapter.makeFileAdapterMiddleware(),
        new UserExternalIdentityMiddleware(),
    ]
}

/** @type {(app: import('express').Application) => void} */
const extendExpressApp = (app) => {
    app.get('/.well-known/change-password', function (req, res) {
        res.redirect('/auth/forgot')
    })
    app.use(Sentry.Handlers.errorHandler())
}

module.exports = prepareKeystone({
    extendExpressApp,
    schemas, tasks, queues: ['low', 'medium', 'high'],
    apps, lastApp,
    ui: { hooks: require.resolve('@app/condo/admin-ui') },
})
